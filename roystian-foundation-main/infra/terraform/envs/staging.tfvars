# Staging: proves the AWS integration end to end without a domain.
# The site is served on https://<id>.cloudfront.net.
#
#   terraform init -backend-config="bucket=<state bucket>" -backend-config="key=roystian/staging/terraform.tfstate"
#   terraform apply -var-file=envs/staging.tfvars -var="alert_email=you@example.org" -var="ses_sender_email=you@example.org"
#
# Tear it down with `terraform destroy` (allow_destroy = true).

environment  = "staging"
domain_name  = ""
cashfree_env = "sandbox"

# Small and single-AZ: this is a test environment.
db_instance_class  = "db.t4g.micro"
db_multi_az        = false
app_cpu            = 512
app_memory         = 1024
app_min_tasks      = 1
app_max_tasks      = 2
single_nat_gateway = true
monthly_budget_usd = 150

# Account-wide singletons belong to the production stack.
enable_guardduty     = false
enable_cloudtrail    = false
enable_github_deploy = false

# No EC2 quota yet; use ECS Exec for database access instead.
enable_bastion = false

allow_destroy = true
