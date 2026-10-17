# Deploying Roystian Foundation on AWS

Everything runs on AWS: ECS Fargate, ALB, CloudFront, WAF, RDS PostgreSQL,
Cognito, S3, SES, Secrets Manager and CloudWatch. All of it is defined in
Terraform (`infra/terraform`). GitHub Actions builds, migrates and deploys
through OIDC. Payments use Cashfree.

This runbook takes a new AWS account to a live site. Tick the boxes as you go.
Steps marked **⏱** take hours or days, so start them on day one.

---

## 0. What gets created

```
Route 53 ─▶ CloudFront (+ AWS WAF, TLS 1.2+, HTTP/3) ─▶ ALB (CloudFront-only, secret header)
                                                         ─▶ ECS Fargate service (2–6 tasks, private subnets)
                                                               ├─▶ RDS PostgreSQL 17 (Multi-AZ, encrypted, TLS-only, private)
                                                               ├─▶ Cognito user pool (email sign-in, TOTP MFA)
                                                               ├─▶ S3 uploads bucket (private, presigned URLs)
                                                               ├─▶ SES (DKIM, MAIL FROM, DMARC)
                                                               └─▶ Cashfree API (via NAT)
Secrets Manager · CloudWatch logs/alarms → SNS email · Route 53 health check · Budgets
VPC flow logs · ALB + S3 access logs · CloudTrail · GuardDuty · SSM jump host · GitHub OIDC role
```

| File | Contents |
| --- | --- |
| `network.tf` | VPC across 2 AZs, public and private subnets, NAT, S3 endpoint, security groups, flow logs |
| `database.tf` | RDS (managed master password, Performance Insights, 14-day backups, deletion protection), SSM jump host |
| `auth.tf` | Cognito user pool, app client with secret, role groups |
| `storage.tf` | Uploads bucket (block public access, SSE, versioning, CORS, TLS-only), logs bucket |
| `email.tf` | SES domain identity, DKIM/MAIL FROM/DMARC records, configuration set, bounce notifications |
| `container.tf` | ECR, ECS cluster, IAM roles, `web`/`migrate`/`db-bootstrap` task definitions, service, auto scaling |
| `loadbalancer.tf` | ACM (ap-south-1), ALB, HTTPS listener (403 by default), CloudFront-only rule |
| `edge.tf` | ACM (us-east-1), CloudFront (static assets cached, dynamic passed through), www redirect, WAF, DNS |
| `secrets.tf` | App secret (DB URL, Cognito client secret) and Cashfree secret (filled in by hand) |
| `monitoring.tf` | SNS, 13 alarms, uptime health check, error log metric, RDS events, budget |
| `cicd.tf` | GitHub OIDC provider and the least-privilege deploy role |
| `account.tf` | GuardDuty, CloudTrail (optional) |

Rough cost at low traffic: about **$180–220 a month**. RDS Multi-AZ is about
$70, the NAT gateway about $35, Fargate about $30, the ALB about $20, and WAF,
CloudFront and the rest about $25.

---

## 1. Before you start

- [ ] **AWS account.** Use a dedicated production account. Turn on MFA for the root user and use IAM Identity Center users, not root.
- [ ] **Tools:** Terraform ≥ 1.9, AWS CLI v2 with the Session Manager plugin, Docker, Node 22, `jq`.
- [ ] **⏱ Domain.** Create a Route 53 **public hosted zone** for the domain. If the domain is registered elsewhere, point the registrar's nameservers at it. Propagation can take up to 48 hours.
- [ ] **⏱ Cashfree.** Complete KYC and activate the **production** account. Have the production App ID and Secret Key ready.
- [ ] **Business content.** Set the real contact email (`NEXT_PUBLIC_CONTACT_EMAIL`) and phone (`data/content.ts`). Replace the placeholder trainer profiles in `data/trainers.ts`. Have counsel review `/privacy`, `/terms` and `/refund-policy`.

## 2. Terraform state (once)

```bash
export AWS_REGION=ap-south-1
STATE_BUCKET=roystian-terraform-state-$(aws sts get-caller-identity --query Account --output text)
aws s3api create-bucket --bucket $STATE_BUCKET --create-bucket-configuration LocationConstraint=$AWS_REGION
aws s3api put-bucket-versioning --bucket $STATE_BUCKET --versioning-configuration Status=Enabled
aws s3api put-public-access-block --bucket $STATE_BUCKET \
  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

cd infra/terraform
cp terraform.tfvars.example terraform.tfvars      # set domain_name, alert_email; leave create_public_dns = false
terraform init -backend-config="bucket=$STATE_BUCKET"
```

## 3. First apply

The ECS service needs an image to exist, so the registry comes first.

```bash
terraform apply -target=aws_ecr_repository.web
REPO=$(terraform output -raw ecr_repository_url)
aws ecr get-login-password | docker login --username AWS --password-stdin ${REPO%%/*}

cd ../..
docker buildx build --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_SITE_URL=https://<your-domain> \
  --build-arg NEXT_PUBLIC_CONTACT_EMAIL=<real contact address> \
  -t $REPO:bootstrap --push .
cd infra/terraform

terraform apply            # everything else (about 20–30 minutes; CloudFront and RDS are the slow parts)
```

- [ ] Confirm the two SNS subscription emails sent to `alert_email` (alerts and SES events).

## 4. Database bootstrap and first migration (once)

The `db-bootstrap` task runs `db/bootstrap.sql` as the RDS master user. It creates:
- the `anon` and `authenticated` request roles;
- the `roystian_app` login role, with the password Terraform generated into Secrets Manager;
- the `roystian` database.

The app never uses the master user.

```bash
CLUSTER=$(terraform output -raw ecs_cluster)
NET="awsvpcConfiguration={subnets=[$(terraform output -raw private_subnets)],securityGroups=[$(terraform output -raw app_security_group)],assignPublicIp=DISABLED}"

run() {   # run a one-off task and fail if it fails
  local task=$(aws ecs run-task --cluster $CLUSTER --launch-type FARGATE --task-definition $1 \
               --network-configuration "$NET" --query 'tasks[0].taskArn' --output text)
  aws ecs wait tasks-stopped --cluster $CLUSTER --tasks $task
  aws ecs describe-tasks --cluster $CLUSTER --tasks $task --query 'tasks[0].containers[0].exitCode'
}
run roystian-prod-db-bootstrap     # → 0
run roystian-prod-migrate          # → 0  (applies db/migrations as roystian_app)
```

Logs for both are in CloudWatch under `/ecs/roystian-prod-web` (prefixes `bootstrap` and `migrate`).

> Never run `npm run aws:setup` or any seed against AWS: it is local-only and
> refuses non-local URLs.

## 5. Cashfree keys

```bash
aws secretsmanager put-secret-value --secret-id roystian-prod/cashfree \
  --secret-string '{"CASHFREE_APP_ID":"<production app id>","CASHFREE_SECRET_KEY":"<production secret>"}'
aws ecs update-service --cluster $CLUSTER --service roystian-prod-web --force-new-deployment
```

In the Cashfree dashboard:
- [ ] Whitelist the domain.
- [ ] Set the webhook URL `https://<domain>/api/payment/webhook`, with the payment success, failed and user-dropped events.

## 6. ⏱ SES production access

New SES accounts are sandboxed: they can only send to verified addresses, up to 200 a day.

- [ ] In SES (ap-south-1), confirm the domain identity shows **Verified**. Terraform published the DKIM records.
- [ ] **Request production access.** It usually takes about a day. Use case: "account verification codes, password reset codes and enrolment/certificate notifications for a learning platform; opt-in users only; bounces and complaints handled through a configuration set".
- [ ] Cognito sends verification and reset codes from `no-reply@<domain>` through this identity.

## 7. GitHub Actions

Set the repository **Settings → Environments → `production`** variables from the Terraform outputs:

| Variable | Value |
| --- | --- |
| `AWS_DEPLOY_ROLE_ARN` | `terraform output -raw github_deploy_role_arn` |
| `ECR_REPOSITORY_URL` | `terraform output -raw ecr_repository_url` |
| `ECS_CLUSTER` / `ECS_SERVICE` | `roystian-prod` / `roystian-prod-web` |
| `ECS_WEB_FAMILY` / `ECS_MIGRATE_FAMILY` | `roystian-prod-web` / `roystian-prod-migrate` |
| `PRIVATE_SUBNETS` | `terraform output -raw private_subnets` |
| `APP_SECURITY_GROUP` | `terraform output -raw app_security_group` |
| `NEXT_PUBLIC_SITE_URL` | `https://<domain>` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | the real contact address |

- [ ] Add required reviewers to the `production` environment, if you want an approval gate.
- [ ] Protect `main`: require pull requests and a passing **CI** workflow.

From then on, each merge to `main` runs CI (typecheck, lint, unit checks, build, every integration suite, browser end-to-end, Terraform validate). Then **Deploy** runs these steps in order:
1. Build the image, tagged with the commit SHA.
2. Register task definitions.
3. Run the migration task, and stop if it fails.
4. Roll the service (the circuit breaker rolls back automatically).
5. Smoke-test `/api/health/ready` and the CSP header.

**Migration rule:** migrations run while the previous version is still serving. Every migration must work with the code that is already running: add columns first, and remove them a release later.

## 8. Test on the CloudFront domain before DNS moves

The app only accepts requests whose `Origin` is the real domain (CSRF protection). So test with the real name pointing at CloudFront locally:

```bash
dig +short $(terraform output -raw cloudfront_domain) | head -1     # an edge IP
# add "<edge IP>  <domain>" to /etc/hosts, then open https://<domain>
```

Run through §10 against it. Remove the hosts entry afterwards.

## 9. Go live

```bash
# terraform.tfvars: create_public_dns = true
terraform apply
```

- [ ] Create the first admin. Sign up on the site, confirm the email, then promote the account:

  ```bash
  aws ssm start-session --target $(terraform output -raw bastion_instance_id) \
    --document-name AWS-StartPortForwardingSessionToRemoteHost \
    --parameters host=$(terraform output -raw rds_endpoint),portNumber=5432,localPortNumber=5433
  # in another terminal (password: roystian-prod/app → APP_DB_PASSWORD)
  psql "postgresql://roystian_app@localhost:5433/roystian?sslmode=require" \
    -c "update public.profiles set role = 'admin' where email = 'you@<domain>';" \
    -c "delete from public.students where id = (select id from public.profiles where email = 'you@<domain>');"
  ```

  At the next sign-in the admin is sent to `/account/security` to enrol an authenticator app.

## 10. Go-live checklist

**Infrastructure**
- [ ] `curl -sI https://<domain>` returns 200, with these headers: `content-security-policy`, `strict-transport-security`, `x-frame-options: DENY`, `x-content-type-options`.
- [ ] `http://` redirects to `https://`, and `www.` redirects to the apex.
- [ ] Requests straight to the ALB DNS name, or to `origin.<domain>` without the header, get **403**.
- [ ] RDS shows **Publicly accessible: No**. A connection without TLS is refused (`rds.force_ssl=1`).
- [ ] `https://<domain>/api/health/ready` returns `{"ok":true,"database":"ok"}`.
- [ ] `/robots.txt` and `/sitemap.xml` use the production domain.
- [ ] Two ECS tasks are healthy. Stopping one causes no outage and it gets replaced.
- [ ] RDS **Reboot with failover**: the site recovers within about 2 minutes.
- [ ] Every CloudWatch alarm is OK, and a test notification reaches the alert email.

**Journeys** (real email addresses, real Cognito)

The first four steps cover what the local emulator can't prove:
- [ ] Sign up → the verification code arrives from `no-reply@<domain>`, passing DKIM → a wrong code is refused → the right code confirms.
- [ ] Forgot password → code email → reset → the old password fails and the new one works.
- [ ] **Sign out, then reuse the old session cookie: it must stay signed out.** This confirms RevokeToken and GlobalSignOut. The emulator can't check it.
- [ ] **Change email in the profile:** a code goes to the new address; the old address keeps working until the code is entered. The emulator can't check this either.
- [ ] Staff sign-in requires the authenticator code. A staff account without MFA is sent to `/account/security`.
- [ ] A real low-value Cashfree payment → the webhook enrols the student → the admin refunds it → the refund shows in Cashfree, and the student loses access to that domain.
- [ ] Module → assessment → practical-task upload. The file lands in S3, a reviewer downloads it, and another student cannot.
- [ ] The certificate is issued once the requirements are met. `https://<domain>/verify/<id>` works signed out; after the admin revokes it, the page shows revoked.
- [ ] `admin_audit_log` records each staff action above.

**Data and access**
- [ ] No `@roystian.local` accounts exist in Cognito or `profiles`.
- [ ] `CASHFREE_ENV=production` in the running task definition.
- [ ] A point-in-time restore of RDS has been rehearsed into a new instance.
- [ ] At least two people have access to AWS, Cashfree, GitHub and the domain registrar.

## 11. Operations

**Roll back the app.** A failed deploy rolls back automatically through the circuit breaker. To roll back by hand:

```bash
aws ecs list-task-definitions --family-prefix roystian-prod-web --sort DESC --max-items 5
aws ecs update-service --cluster roystian-prod --service roystian-prod-web --task-definition roystian-prod-web:<revision>
```

**Roll back the database.** Migrations are forward-only, so fix a bad one with a new migration. After data loss, use RDS point-in-time restore into a new instance (14-day window), then switch `DATABASE_URL`.

**Database access.** Open an SSM port-forward through the jump host (§9). There is no public endpoint.

**Debug a container.** Use `aws ecs execute-command --cluster roystian-prod --task <id> --container web --interactive --command sh`.

**Rotate secrets.**
- **App database password:** create a new password, then `ALTER ROLE roystian_app PASSWORD …`, update `roystian-prod/app`, and force a new deployment.
- **Cognito client secret:** add a new app client, deploy it, then remove the old one.
- **Cashfree keys:** update `roystian-prod/cashfree` and force a new deployment.

**Routine work**

| How often | What |
| --- | --- |
| Weekly | WAF counted/blocked requests (move `AWSManagedRulesCommonRuleSet` from count to block after the first week), SES bounces and complaints, alarm history |
| Monthly | `npm audit`, ECR scan findings, cost against budget, RDS minor versions |
| Quarterly | Restore drill, review staff roles (`select email, role from profiles where role <> 'student'`), rotate the database password |

## 12. Security review of the infrastructure code

Checkov (`bridgecrew/checkov`, Terraform framework) reports **259 passed, 49 failed** at the time of writing. The remaining failures are deliberate:

| Finding | Why it is accepted |
| --- | --- |
| KMS customer-managed keys (RDS PI, Secrets Manager, CloudWatch Logs, ECR, CloudTrail, SNS) | AWS-managed encryption is on everywhere. Customer-managed keys add cost and key-policy upkeep with no requirement behind them yet. SNS topics written by SES and CloudWatch can't use the default `aws/sns` key. |
| Log retention under 1 year | Application logs 30 days, flow logs 90 days, access logs 180 days. Raise this if a compliance regime requires it. |
| Automatic secret rotation | Rotating the database password needs a rotation Lambda for a role the app holds open. It's a quarterly manual step instead (§11). The RDS master password **is** managed and rotated by RDS. |
| RDS IAM authentication | Password authentication over enforced TLS, with the password held only in Secrets Manager. |
| CloudFront geo restriction / origin failover / default root object | Global audience, a single origin by design, and Next.js serves `/`. |
| CloudFront access logs | WAF logs (cookie and authorization headers redacted) and ALB access logs cover request auditing. |
| ALB without WAF | WAF is attached to CloudFront, and the ALB accepts only CloudFront traffic carrying the secret header. |
| Web container root filesystem writable | Next.js writes its image-optimisation cache. The migration task is read-only. |
| Bastion EBS-optimised / detailed monitoring | t4g.nano jump host with no inbound ports. |
