# Application Load Balancer. Reachable only from CloudFront's origin-facing
# IP ranges (security group) and only with the secret origin header
# (listener rule); everything else gets 403.
#
# With a domain, CloudFront connects over HTTPS (ACM certificate for
# origin.<domain>). Without one (staging) there is no name to certify, so
# CloudFront connects over HTTP; the CloudFront-only lock still applies.

locals {
  alb_port = local.use_domain ? 443 : 80
}

resource "aws_acm_certificate" "origin" {
  count                     = local.use_domain ? 1 : 0
  domain_name               = var.domain_name
  subject_alternative_names = ["*.${var.domain_name}"]
  validation_method         = "DNS"
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "origin_cert_validation" {
  for_each = local.use_domain ? {
    for dvo in aws_acm_certificate.origin[0].domain_validation_options : dvo.domain_name => dvo
  } : {}
  zone_id         = data.aws_route53_zone.main[0].zone_id
  name            = each.value.resource_record_name
  type            = each.value.resource_record_type
  records         = [each.value.resource_record_value]
  ttl             = 300
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "origin" {
  count                   = local.use_domain ? 1 : 0
  certificate_arn         = aws_acm_certificate.origin[0].arn
  validation_record_fqdns = [for r in aws_route53_record.origin_cert_validation : r.fqdn]
}

resource "random_password" "origin_secret" {
  length  = 48
  special = false
}

resource "aws_lb" "main" {
  name                       = local.prefix
  load_balancer_type         = "application"
  internal                   = false
  subnets                    = aws_subnet.public[*].id
  security_groups            = [aws_security_group.alb.id]
  drop_invalid_header_fields = true
  enable_deletion_protection = !var.allow_destroy
  idle_timeout               = 60
  access_logs {
    bucket  = aws_s3_bucket.logs.id
    prefix  = "alb"
    enabled = true
  }
  depends_on = [aws_s3_bucket_policy.logs]
}

resource "aws_lb_target_group" "web" {
  name                 = "${local.prefix}-web"
  port                 = 3000
  protocol             = "HTTP"
  target_type          = "ip"
  vpc_id               = aws_vpc.main.id
  deregistration_delay = 30
  health_check {
    path                = "/api/health"
    matcher             = "200"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 15
    timeout             = 5
  }
}

resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn
  port              = local.alb_port
  protocol          = local.use_domain ? "HTTPS" : "HTTP"
  ssl_policy        = local.use_domain ? "ELBSecurityPolicy-TLS13-1-2-2021-06" : null
  certificate_arn   = local.use_domain ? aws_acm_certificate_validation.origin[0].certificate_arn : null
  default_action {
    type = "fixed-response"
    fixed_response {
      content_type = "text/plain"
      message_body = "Forbidden"
      status_code  = "403"
    }
  }
}

resource "aws_lb_listener_rule" "from_cloudfront" {
  listener_arn = aws_lb_listener.main.arn
  priority     = 1
  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }
  condition {
    http_header {
      http_header_name = "X-Origin-Verify"
      values           = [random_password.origin_secret.result]
    }
  }
}

resource "aws_route53_record" "origin" {
  count   = local.use_domain ? 1 : 0
  zone_id = data.aws_route53_zone.main[0].zone_id
  name    = local.origin_dns
  type    = "A"
  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}
