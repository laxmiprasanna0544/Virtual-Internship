# Amazon SES.
#
# With a domain: verified domain identity with DKIM, custom MAIL FROM and
# DMARC. Without one (staging): a single verified sender address.
# Both get a configuration set that publishes bounces and complaints to SNS.
#
# New SES accounts are in the sandbox (verified recipients only, 200/day).
# Request production access in the SES console before launch.

data "aws_route53_zone" "main" {
  count        = local.use_domain ? 1 : 0
  name         = var.domain_name
  private_zone = false
}

resource "aws_sesv2_email_identity" "domain" {
  count                  = local.use_domain ? 1 : 0
  email_identity         = var.domain_name
  configuration_set_name = aws_sesv2_configuration_set.main.configuration_set_name
  dkim_signing_attributes {
    next_signing_key_length = "RSA_2048_BIT"
  }
}

resource "aws_sesv2_email_identity" "sender" {
  count                  = local.use_domain ? 0 : 1
  email_identity         = var.ses_sender_email
  configuration_set_name = aws_sesv2_configuration_set.main.configuration_set_name
  lifecycle {
    precondition {
      condition     = var.ses_sender_email != ""
      error_message = "Set ses_sender_email when domain_name is empty."
    }
  }
}

resource "aws_route53_record" "dkim" {
  count   = local.use_domain ? 3 : 0
  zone_id = data.aws_route53_zone.main[0].zone_id
  name    = "${aws_sesv2_email_identity.domain[0].dkim_signing_attributes[0].tokens[count.index]}._domainkey.${var.domain_name}"
  type    = "CNAME"
  ttl     = 1800
  records = ["${aws_sesv2_email_identity.domain[0].dkim_signing_attributes[0].tokens[count.index]}.dkim.amazonses.com"]
}

resource "aws_sesv2_email_identity_mail_from_attributes" "domain" {
  count                  = local.use_domain ? 1 : 0
  email_identity         = aws_sesv2_email_identity.domain[0].email_identity
  mail_from_domain       = "mail.${var.domain_name}"
  behavior_on_mx_failure = "USE_DEFAULT_VALUE"
}

resource "aws_route53_record" "mail_from_mx" {
  count   = local.use_domain ? 1 : 0
  zone_id = data.aws_route53_zone.main[0].zone_id
  name    = "mail.${var.domain_name}"
  type    = "MX"
  ttl     = 1800
  records = ["10 feedback-smtp.${var.region}.amazonses.com"]
}

resource "aws_route53_record" "mail_from_spf" {
  count   = local.use_domain ? 1 : 0
  zone_id = data.aws_route53_zone.main[0].zone_id
  name    = "mail.${var.domain_name}"
  type    = "TXT"
  ttl     = 1800
  records = ["v=spf1 include:amazonses.com ~all"]
}

resource "aws_route53_record" "dmarc" {
  count   = local.use_domain ? 1 : 0
  zone_id = data.aws_route53_zone.main[0].zone_id
  name    = "_dmarc.${var.domain_name}"
  type    = "TXT"
  ttl     = 1800
  records = ["v=DMARC1; p=quarantine; rua=mailto:dmarc@${var.domain_name}"]
}

resource "aws_sesv2_configuration_set" "main" {
  configuration_set_name = local.prefix
  reputation_options {
    reputation_metrics_enabled = true
  }
  suppression_options {
    suppressed_reasons = ["BOUNCE", "COMPLAINT"]
  }
}

resource "aws_sns_topic" "ses_events" {
  name = "${local.prefix}-ses-events"
}

resource "aws_sns_topic_subscription" "ses_events_email" {
  topic_arn = aws_sns_topic.ses_events.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

resource "aws_sesv2_configuration_set_event_destination" "bounces" {
  configuration_set_name = aws_sesv2_configuration_set.main.configuration_set_name
  event_destination_name = "bounces-and-complaints"
  event_destination {
    enabled              = true
    matching_event_types = ["BOUNCE", "COMPLAINT", "REJECT"]
    sns_destination {
      topic_arn = aws_sns_topic.ses_events.arn
    }
  }
}
