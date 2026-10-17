# Alarms → SNS → email. Add a Slack/Teams subscription (AWS Chatbot) if wanted.

resource "aws_sns_topic" "alerts" {
  name = "${local.prefix}-alerts"
}

resource "aws_sns_topic_subscription" "alerts_email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# CloudFront metrics and Route 53 health checks live in us-east-1.
resource "aws_sns_topic" "alerts_us_east_1" {
  provider = aws.us_east_1
  name     = "${local.prefix}-alerts"
}

resource "aws_sns_topic_subscription" "alerts_us_east_1_email" {
  provider  = aws.us_east_1
  topic_arn = aws_sns_topic.alerts_us_east_1.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

locals {
  alarms = {
    alb_5xx = {
      namespace  = "AWS/ApplicationELB", metric = "HTTPCode_Target_5XX_Count", stat = "Sum",
      threshold  = 10, period = 300, periods = 1, comparison = "GreaterThanThreshold",
      dimensions = { LoadBalancer = aws_lb.main.arn_suffix }
    }
    unhealthy_hosts = {
      namespace  = "AWS/ApplicationELB", metric = "UnHealthyHostCount", stat = "Maximum",
      threshold  = 0, period = 60, periods = 5, comparison = "GreaterThanThreshold",
      dimensions = { LoadBalancer = aws_lb.main.arn_suffix, TargetGroup = aws_lb_target_group.web.arn_suffix }
    }
    slow_responses = {
      namespace  = "AWS/ApplicationELB", metric = "TargetResponseTime", stat = "p95",
      threshold  = 2, period = 300, periods = 2, comparison = "GreaterThanThreshold",
      dimensions = { LoadBalancer = aws_lb.main.arn_suffix }
    }
    ecs_cpu = {
      namespace  = "AWS/ECS", metric = "CPUUtilization", stat = "Average",
      threshold  = 80, period = 300, periods = 2, comparison = "GreaterThanThreshold",
      dimensions = { ClusterName = aws_ecs_cluster.main.name, ServiceName = aws_ecs_service.web.name }
    }
    ecs_memory = {
      namespace  = "AWS/ECS", metric = "MemoryUtilization", stat = "Average",
      threshold  = 80, period = 300, periods = 2, comparison = "GreaterThanThreshold",
      dimensions = { ClusterName = aws_ecs_cluster.main.name, ServiceName = aws_ecs_service.web.name }
    }
    running_tasks = {
      namespace  = "ECS/ContainerInsights", metric = "RunningTaskCount", stat = "Minimum",
      threshold  = var.app_min_tasks, period = 60, periods = 5, comparison = "LessThanThreshold",
      dimensions = { ClusterName = aws_ecs_cluster.main.name, ServiceName = aws_ecs_service.web.name }
    }
    rds_cpu = {
      namespace  = "AWS/RDS", metric = "CPUUtilization", stat = "Average",
      threshold  = 80, period = 300, periods = 2, comparison = "GreaterThanThreshold",
      dimensions = { DBInstanceIdentifier = aws_db_instance.main.identifier }
    }
    rds_storage = {
      namespace  = "AWS/RDS", metric = "FreeStorageSpace", stat = "Minimum",
      threshold  = 5 * 1024 * 1024 * 1024, period = 300, periods = 1, comparison = "LessThanThreshold",
      dimensions = { DBInstanceIdentifier = aws_db_instance.main.identifier }
    }
    rds_memory = {
      namespace  = "AWS/RDS", metric = "FreeableMemory", stat = "Minimum",
      threshold  = 200 * 1024 * 1024, period = 300, periods = 2, comparison = "LessThanThreshold",
      dimensions = { DBInstanceIdentifier = aws_db_instance.main.identifier }
    }
    rds_connections = {
      namespace  = "AWS/RDS", metric = "DatabaseConnections", stat = "Maximum",
      threshold  = 150, period = 300, periods = 1, comparison = "GreaterThanThreshold",
      dimensions = { DBInstanceIdentifier = aws_db_instance.main.identifier }
    }
    ses_bounces = {
      namespace  = "AWS/SES", metric = "Reputation.BounceRate", stat = "Maximum",
      threshold  = 0.05, period = 3600, periods = 1, comparison = "GreaterThanThreshold",
      dimensions = {}
    }
  }
}

resource "aws_cloudwatch_metric_alarm" "main" {
  for_each            = local.alarms
  alarm_name          = "${local.prefix}-${each.key}"
  namespace           = each.value.namespace
  metric_name         = each.value.metric
  statistic           = contains(["p95", "p99"], each.value.stat) ? null : each.value.stat
  extended_statistic  = contains(["p95", "p99"], each.value.stat) ? each.value.stat : null
  threshold           = each.value.threshold
  period              = each.value.period
  evaluation_periods  = each.value.periods
  comparison_operator = each.value.comparison
  dimensions          = each.value.dimensions
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
}

resource "aws_cloudwatch_metric_alarm" "cloudfront_5xx" {
  provider            = aws.us_east_1
  alarm_name          = "${local.prefix}-cloudfront-5xx"
  namespace           = "AWS/CloudFront"
  metric_name         = "5xxErrorRate"
  statistic           = "Average"
  threshold           = 1
  period              = 300
  evaluation_periods  = 1
  comparison_operator = "GreaterThanThreshold"
  dimensions          = { DistributionId = aws_cloudfront_distribution.main.id, Region = "Global" }
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alerts_us_east_1.arn]
}

# Uptime: the readiness endpoint also checks the database.
resource "aws_route53_health_check" "site" {
  fqdn              = local.site_host
  type              = "HTTPS"
  port              = 443
  resource_path     = "/api/health/ready"
  request_interval  = 30
  failure_threshold = 3
  measure_latency   = true
  tags              = { Name = "${local.prefix}-site" }
}

resource "aws_cloudwatch_metric_alarm" "site_down" {
  provider            = aws.us_east_1
  alarm_name          = "${local.prefix}-site-down"
  namespace           = "AWS/Route53"
  metric_name         = "HealthCheckStatus"
  statistic           = "Minimum"
  threshold           = 1
  period              = 60
  evaluation_periods  = 2
  comparison_operator = "LessThanThreshold"
  dimensions          = { HealthCheckId = aws_route53_health_check.site.id }
  alarm_actions       = [aws_sns_topic.alerts_us_east_1.arn]
  ok_actions          = [aws_sns_topic.alerts_us_east_1.arn]
}

# Application errors logged by the containers.
resource "aws_cloudwatch_log_metric_filter" "app_errors" {
  name           = "${local.prefix}-app-errors"
  log_group_name = aws_cloudwatch_log_group.web.name
  pattern        = "?\"failed:\" ?Error ?\"⨯\""
  metric_transformation {
    name      = "AppErrors"
    namespace = "Roystian"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "app_errors" {
  alarm_name          = "${local.prefix}-app-errors"
  namespace           = "Roystian"
  metric_name         = "AppErrors"
  statistic           = "Sum"
  threshold           = 20
  period              = 300
  evaluation_periods  = 1
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.alerts.arn]
}

resource "aws_db_event_subscription" "rds" {
  name             = "${local.prefix}-rds-events"
  sns_topic        = aws_sns_topic.alerts.arn
  source_type      = "db-instance"
  source_ids       = [aws_db_instance.main.identifier]
  event_categories = ["failover", "failure", "low storage", "maintenance", "notification"]
}

resource "aws_budgets_budget" "monthly" {
  name         = "${local.prefix}-monthly"
  budget_type  = "COST"
  limit_amount = tostring(var.monthly_budget_usd)
  limit_unit   = "USD"
  time_unit    = "MONTHLY"
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.alert_email]
  }
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = [var.alert_email]
  }
}
