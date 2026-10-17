# Application secrets. Terraform generates and stores the database role
# password and copies the Cognito client secret. The Cashfree keys are set
# out-of-band (console or CLI) so they never pass through Terraform state:
#
#   aws secretsmanager put-secret-value --secret-id roystian-prod/cashfree \
#     --secret-string '{"CASHFREE_APP_ID":"…","CASHFREE_SECRET_KEY":"…"}'

resource "aws_secretsmanager_secret" "app" {
  name                    = "${local.prefix}/app"
  description             = "Database URL and Cognito client secret for the web app"
  recovery_window_in_days = var.allow_destroy ? 0 : 7
}

resource "aws_secretsmanager_secret_version" "app" {
  secret_id = aws_secretsmanager_secret.app.id
  secret_string = jsonencode({
    DATABASE_URL          = "postgresql://roystian_app:${random_password.app_db.result}@${aws_db_instance.main.address}:5432/roystian?sslmode=verify-full&sslrootcert=/etc/ssl/certs/rds-global-bundle.pem"
    APP_DB_PASSWORD       = random_password.app_db.result
    COGNITO_CLIENT_SECRET = aws_cognito_user_pool_client.web.client_secret
  })
}

resource "aws_secretsmanager_secret" "cashfree" {
  name                    = "${local.prefix}/cashfree"
  description             = "Cashfree Payments API credentials (set out-of-band)"
  recovery_window_in_days = var.allow_destroy ? 0 : 7
}

resource "aws_secretsmanager_secret_version" "cashfree_placeholder" {
  secret_id     = aws_secretsmanager_secret.cashfree.id
  secret_string = jsonencode({ CASHFREE_APP_ID = "set-me", CASHFREE_SECRET_KEY = "set-me" })
  lifecycle {
    ignore_changes = [secret_string]
  }
}
