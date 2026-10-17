data "aws_caller_identity" "current" {}
data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  prefix     = "${var.name}-${var.environment}"
  account_id = data.aws_caller_identity.current.account_id
  azs        = slice(data.aws_availability_zones.available.names, 0, 2)

  # Without a domain (staging), the site is served on CloudFront's own
  # *.cloudfront.net name with its default certificate.
  use_domain = var.domain_name != ""
  site_host  = local.use_domain ? var.domain_name : aws_cloudfront_distribution.main.domain_name
  site_url   = "https://${local.site_host}"
  origin_dns = "origin.${var.domain_name}"

  uploads_bucket = "${local.prefix}-uploads-${local.account_id}"
  ses_from       = local.use_domain ? "no-reply@${var.domain_name}" : var.ses_sender_email

  tags = {
    Project     = var.name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}
