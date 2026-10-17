variable "region" {
  description = "Primary region (Mumbai, closest to Indian users)."
  type        = string
  default     = "ap-south-1"
}

variable "name" {
  description = "Resource name prefix."
  type        = string
  default     = "roystian"
}

variable "environment" {
  description = "Environment name, e.g. prod or staging."
  type        = string
  default     = "prod"
}

variable "domain_name" {
  description = "Apex domain served by CloudFront, e.g. example.org (its Route 53 hosted zone must exist). Empty for a staging stack on the *.cloudfront.net URL."
  type        = string
  default     = ""
}

variable "ses_sender_email" {
  description = "Only without a domain: a single address SES verifies and sends app email from (AWS emails it a verification link)."
  type        = string
  default     = ""
}

variable "alert_email" {
  description = "Where CloudWatch alarms and budget alerts are emailed."
  type        = string
}

variable "github_repository" {
  description = "owner/repo allowed to deploy through GitHub Actions OIDC."
  type        = string
  default     = "laxmiprasanna0544/Virtual-Internship"
}

variable "image_tag" {
  description = "Image tag the task definitions start with. CI replaces it on every deploy."
  type        = string
  default     = "bootstrap"
}

variable "db_instance_class" {
  type    = string
  default = "db.t4g.small"
}

variable "db_multi_az" {
  description = "Standby in a second AZ with automatic failover. Recommended for production."
  type        = bool
  default     = true
}

variable "db_allocated_storage" {
  type    = number
  default = 20
}

variable "db_max_allocated_storage" {
  type    = number
  default = 100
}

variable "app_cpu" {
  type    = number
  default = 512
}

variable "app_memory" {
  type    = number
  default = 1024
}

variable "app_min_tasks" {
  type    = number
  default = 2
}

variable "app_max_tasks" {
  type    = number
  default = 6
}

variable "single_nat_gateway" {
  description = "One NAT gateway (cheaper) instead of one per AZ (survives an AZ outage)."
  type        = bool
  default     = true
}

variable "enable_bastion" {
  description = "Small EC2 instance in a private subnet for SSM port-forwarding to RDS."
  type        = bool
  default     = true
}

variable "enable_guardduty" {
  description = "Create a GuardDuty detector. Set false if the account already has one."
  type        = bool
  default     = true
}

variable "enable_cloudtrail" {
  description = "Create a multi-region CloudTrail trail. Set false if an organisation trail exists."
  type        = bool
  default     = true
}

variable "monthly_budget_usd" {
  type    = number
  default = 250
}

variable "cashfree_env" {
  description = "production or sandbox."
  type        = string
  default     = "production"
  validation {
    condition     = contains(["production", "sandbox"], var.cashfree_env)
    error_message = "cashfree_env must be production or sandbox."
  }
}

variable "contact_email" {
  description = "Public contact address shown on the site (NEXT_PUBLIC_CONTACT_EMAIL is set at build time in CI)."
  type        = string
  default     = ""
}

variable "create_public_dns" {
  description = "Point the apex and www records at CloudFront. Keep false until the go-live checklist passes on the CloudFront domain."
  type        = bool
  default     = false
}

variable "cpu_architecture" {
  description = "ARM64 (Graviton, cheaper; the default) or X86_64. Must match the image the pipeline builds."
  type        = string
  default     = "ARM64"
}

variable "enable_github_deploy" {
  description = "Create the GitHub Actions OIDC provider and deploy role. The provider is one per account: enable it in one stack only."
  type        = bool
  default     = true
}

variable "allow_destroy" {
  description = "Staging only: turn off deletion protection and final snapshots so `terraform destroy` removes everything."
  type        = bool
  default     = false
}
