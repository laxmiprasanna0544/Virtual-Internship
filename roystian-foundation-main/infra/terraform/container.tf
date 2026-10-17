# Container registry, ECS cluster, task definitions and the service.

resource "aws_ecr_repository" "web" {
  name                 = "${local.prefix}-web"
  force_delete         = var.allow_destroy
  image_tag_mutability = "IMMUTABLE"
  image_scanning_configuration {
    scan_on_push = true
  }
  encryption_configuration {
    encryption_type = "AES256"
  }
}

resource "aws_ecr_lifecycle_policy" "web" {
  repository = aws_ecr_repository.web.name
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep the last 30 images"
      selection    = { tagStatus = "any", countType = "imageCountMoreThan", countNumber = 30 }
      action       = { type = "expire" }
    }]
  })
}

resource "aws_cloudwatch_log_group" "web" {
  name              = "/ecs/${local.prefix}-web"
  retention_in_days = 30
}

resource "aws_ecs_cluster" "main" {
  name = local.prefix
  setting {
    name  = "containerInsights"
    value = "enhanced"
  }
}

# Roles ---------------------------------------------------------------------------

data "aws_iam_policy_document" "ecs_tasks_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "execution" {
  name               = "${local.prefix}-ecs-execution"
  assume_role_policy = data.aws_iam_policy_document.ecs_tasks_assume.json
}

resource "aws_iam_role_policy_attachment" "execution" {
  role       = aws_iam_role.execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "execution_secrets" {
  name = "read-app-secrets"
  role = aws_iam_role.execution.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = ["secretsmanager:GetSecretValue"]
      Resource = [
        aws_secretsmanager_secret.app.arn,
        aws_secretsmanager_secret.cashfree.arn,
        aws_db_instance.main.master_user_secret[0].secret_arn,
      ]
    }]
  })
}

resource "aws_iam_role" "task" {
  name               = "${local.prefix}-ecs-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_tasks_assume.json
}

resource "aws_iam_role_policy" "task" {
  name = "app-permissions"
  role = aws_iam_role.task.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "Uploads"
        Effect   = "Allow"
        Action   = ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"]
        Resource = ["${aws_s3_bucket.uploads.arn}/submissions/*", "${aws_s3_bucket.uploads.arn}/projects/*"]
      },
      {
        Sid      = "Email"
        Effect   = "Allow"
        Action   = ["ses:SendEmail", "ses:SendRawEmail"]
        Resource = "*"
        Condition = {
          StringEquals = { "ses:FromAddress" = local.ses_from }
        }
      },
      {
        Sid    = "CognitoAdmin"
        Effect = "Allow"
        Action = [
          "cognito-idp:AdminGetUser",
          "cognito-idp:AdminDisableUser",
          "cognito-idp:AdminEnableUser",
          "cognito-idp:AdminUserGlobalSignOut",
          "cognito-idp:AdminAddUserToGroup",
          "cognito-idp:AdminRemoveUserFromGroup",
          "cognito-idp:AdminDeleteUser",
        ]
        Resource = aws_cognito_user_pool.main.arn
      },
      {
        Sid      = "EcsExec"
        Effect   = "Allow"
        Action   = ["ssmmessages:CreateControlChannel", "ssmmessages:CreateDataChannel", "ssmmessages:OpenControlChannel", "ssmmessages:OpenDataChannel"]
        Resource = "*"
      },
    ]
  })
}

# Task definitions ---------------------------------------------------------------------

locals {
  image = "${aws_ecr_repository.web.repository_url}:${var.image_tag}"

  app_environment = [
    { name = "NODE_ENV", value = "production" },
    { name = "NEXT_PUBLIC_SITE_URL", value = local.site_url },
    { name = "AWS_REGION", value = var.region },
    { name = "DATABASE_SSL", value = "verify-full" },
    { name = "DATABASE_POOL_MAX", value = "5" },
    { name = "COGNITO_USER_POOL_ID", value = aws_cognito_user_pool.main.id },
    { name = "COGNITO_CLIENT_ID", value = aws_cognito_user_pool_client.web.id },
    { name = "STAFF_MFA_REQUIRED", value = "true" },
    { name = "S3_UPLOADS_BUCKET", value = aws_s3_bucket.uploads.bucket },
    { name = "SES_FROM", value = local.use_domain ? "Roystian Foundation <${local.ses_from}>" : local.ses_from },
    { name = "SES_CONFIGURATION_SET", value = aws_sesv2_configuration_set.main.configuration_set_name },
    { name = "CASHFREE_ENV", value = var.cashfree_env },
  ]

  app_secrets = [
    { name = "DATABASE_URL", valueFrom = "${aws_secretsmanager_secret.app.arn}:DATABASE_URL::" },
    { name = "COGNITO_CLIENT_SECRET", valueFrom = "${aws_secretsmanager_secret.app.arn}:COGNITO_CLIENT_SECRET::" },
    { name = "CASHFREE_APP_ID", valueFrom = "${aws_secretsmanager_secret.cashfree.arn}:CASHFREE_APP_ID::" },
    { name = "CASHFREE_SECRET_KEY", valueFrom = "${aws_secretsmanager_secret.cashfree.arn}:CASHFREE_SECRET_KEY::" },
  ]

  log_options = {
    "awslogs-group"         = aws_cloudwatch_log_group.web.name
    "awslogs-region"        = var.region
    "awslogs-stream-prefix" = "web"
  }
}

resource "aws_ecs_task_definition" "web" {
  family                   = "${local.prefix}-web"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.app_cpu
  memory                   = var.app_memory
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.task.arn
  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = var.cpu_architecture
  }
  container_definitions = jsonencode([{
    name         = "web"
    image        = local.image
    essential    = true
    portMappings = [{ containerPort = 3000, protocol = "tcp" }]
    environment  = local.app_environment
    secrets      = local.app_secrets
    healthCheck = {
      command     = ["CMD-SHELL", "wget -qO- http://127.0.0.1:3000/api/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 20
    }
    logConfiguration = { logDriver = "awslogs", options = local.log_options }
  }])
  # CI registers new revisions with new image tags; Terraform owns the shape.
  lifecycle {
    ignore_changes = [container_definitions]
  }
}

# Same image; runs the migrations and exits. CI runs it before every deploy.
resource "aws_ecs_task_definition" "migrate" {
  family                   = "${local.prefix}-migrate"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.task.arn
  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = var.cpu_architecture
  }
  container_definitions = jsonencode([{
    name                   = "migrate"
    image                  = local.image
    essential              = true
    readonlyRootFilesystem = true
    command                = ["dbmate", "--migrations-dir", "./db/migrations", "--no-dump-schema", "--wait", "up"]
    secrets                = [{ name = "DATABASE_URL", valueFrom = "${aws_secretsmanager_secret.app.arn}:DATABASE_URL::" }]
    logConfiguration = {
      logDriver = "awslogs"
      options   = merge(local.log_options, { "awslogs-stream-prefix" = "migrate" })
    }
  }])
  lifecycle {
    ignore_changes = [container_definitions]
  }
}

# One-time: creates the anon/authenticated roles, the roystian_app login role
# (with the generated password) and the database, as the RDS master user.
# Run once after the first `terraform apply` (see docs/DEPLOY-AWS.md).
resource "aws_ecs_task_definition" "bootstrap" {
  family                   = "${local.prefix}-db-bootstrap"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.execution.arn
  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = var.cpu_architecture
  }
  container_definitions = jsonencode([{
    name      = "bootstrap"
    image     = "public.ecr.aws/docker/library/postgres:17-alpine"
    essential = true
    command = [
      "sh", "-c",
      "printf '%s' \"$BOOTSTRAP_SQL\" | PGPASSWORD=\"$MASTER_PASSWORD\" psql \"host=$DB_HOST port=5432 dbname=postgres user=$MASTER_USER sslmode=require\" -v app_password=\"$APP_DB_PASSWORD\" -f -",
    ]
    environment = [
      { name = "DB_HOST", value = aws_db_instance.main.address },
      { name = "BOOTSTRAP_SQL", value = file("${path.module}/../../db/bootstrap.sql") },
    ]
    secrets = [
      { name = "MASTER_USER", valueFrom = "${aws_db_instance.main.master_user_secret[0].secret_arn}:username::" },
      { name = "MASTER_PASSWORD", valueFrom = "${aws_db_instance.main.master_user_secret[0].secret_arn}:password::" },
      { name = "APP_DB_PASSWORD", valueFrom = "${aws_secretsmanager_secret.app.arn}:APP_DB_PASSWORD::" },
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options   = merge(local.log_options, { "awslogs-stream-prefix" = "bootstrap" })
    }
  }])
}

# Service and auto scaling ---------------------------------------------------------------

resource "aws_ecs_service" "web" {
  name                              = "${local.prefix}-web"
  cluster                           = aws_ecs_cluster.main.id
  task_definition                   = aws_ecs_task_definition.web.arn
  desired_count                     = var.app_min_tasks
  launch_type                       = "FARGATE"
  health_check_grace_period_seconds = 30
  enable_execute_command            = true
  propagate_tags                    = "SERVICE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.app.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.web.arn
    container_name   = "web"
    container_port   = 3000
  }

  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200
  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  # CI updates the task definition and auto scaling owns the count.
  lifecycle {
    ignore_changes = [task_definition, desired_count]
  }
  depends_on = [aws_lb_listener.main]
}

resource "aws_appautoscaling_target" "web" {
  service_namespace  = "ecs"
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.web.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  min_capacity       = var.app_min_tasks
  max_capacity       = var.app_max_tasks
}

resource "aws_appautoscaling_policy" "web_cpu" {
  name               = "${local.prefix}-web-cpu"
  service_namespace  = aws_appautoscaling_target.web.service_namespace
  resource_id        = aws_appautoscaling_target.web.resource_id
  scalable_dimension = aws_appautoscaling_target.web.scalable_dimension
  policy_type        = "TargetTrackingScaling"
  target_tracking_scaling_policy_configuration {
    target_value       = 60
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
  }
}
