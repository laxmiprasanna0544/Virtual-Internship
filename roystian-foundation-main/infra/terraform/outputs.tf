output "site_url" {
  value = local.site_url
}

output "cloudfront_domain" {
  description = "Test the stack here before DNS points at it."
  value       = aws_cloudfront_distribution.main.domain_name
}

output "ecr_repository_url" {
  value = aws_ecr_repository.web.repository_url
}

output "ecs_cluster" {
  value = aws_ecs_cluster.main.name
}

output "ecs_service" {
  value = aws_ecs_service.web.name
}

output "private_subnets" {
  description = "Comma-separated, for the GitHub PRIVATE_SUBNETS variable."
  value       = join(",", aws_subnet.private[*].id)
}

output "app_security_group" {
  value = aws_security_group.app.id
}

output "github_deploy_role_arn" {
  value = var.enable_github_deploy ? aws_iam_role.github_deploy[0].arn : null
}

output "rds_endpoint" {
  value = aws_db_instance.main.address
}

output "rds_master_secret_arn" {
  value = aws_db_instance.main.master_user_secret[0].secret_arn
}

output "bastion_instance_id" {
  value = var.enable_bastion ? aws_instance.bastion[0].id : null
}

output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.main.id
}

output "uploads_bucket" {
  value = aws_s3_bucket.uploads.bucket
}

output "cashfree_secret_arn" {
  description = "Put the Cashfree production keys here (see secrets.tf)."
  value       = aws_secretsmanager_secret.cashfree.arn
}

output "task_definition_families" {
  value = {
    web       = aws_ecs_task_definition.web.family
    migrate   = aws_ecs_task_definition.migrate.family
    bootstrap = aws_ecs_task_definition.bootstrap.family
  }
}
