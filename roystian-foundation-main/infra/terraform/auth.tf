# Amazon Cognito user pool. Email is the sign-in name; the app client has a
# secret and every call is made from the server (tokens live in httpOnly
# cookies). TOTP MFA is available to everyone and required for staff by the
# app (STAFF_MFA_REQUIRED).

resource "aws_cognito_user_pool" "main" {
  name                     = local.prefix
  user_pool_tier           = "ESSENTIALS"
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]
  deletion_protection      = var.allow_destroy ? "INACTIVE" : "ACTIVE"
  mfa_configuration        = "OPTIONAL"

  software_token_mfa_configuration {
    enabled = true
  }

  password_policy {
    minimum_length                   = 10
    require_lowercase                = true
    require_uppercase                = true
    require_numbers                  = true
    require_symbols                  = false
    temporary_password_validity_days = 3
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # A changed email is not used until the new address is verified.
  user_attribute_update_settings {
    attributes_require_verification_before_update = ["email"]
  }

  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true
    string_attribute_constraints {
      min_length = 3
      max_length = 254
    }
  }

  schema {
    name                = "name"
    attribute_data_type = "String"
    required            = true
    mutable             = true
    string_attribute_constraints {
      min_length = 1
      max_length = 120
    }
  }

  # With a domain, codes are sent through SES from no-reply@<domain>. Without
  # one (staging), Cognito's built-in sender is used (50 emails/day, any recipient).
  email_configuration {
    email_sending_account = local.use_domain ? "DEVELOPER" : "COGNITO_DEFAULT"
    source_arn            = local.use_domain ? aws_sesv2_email_identity.domain[0].arn : null
    from_email_address    = local.use_domain ? "Roystian Foundation <${local.ses_from}>" : null
    configuration_set     = local.use_domain ? aws_sesv2_configuration_set.main.configuration_set_name : null
  }

  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "Your Roystian Foundation verification code"
    email_message        = "Your Roystian Foundation verification code is {####}. It expires in 24 hours. If you did not create an account, ignore this email."
  }

  admin_create_user_config {
    allow_admin_create_user_only = false
  }
}

resource "aws_cognito_user_pool_client" "web" {
  name            = "${local.prefix}-web"
  user_pool_id    = aws_cognito_user_pool.main.id
  generate_secret = true

  explicit_auth_flows = ["ALLOW_USER_PASSWORD_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"]

  access_token_validity  = 1
  id_token_validity      = 1
  refresh_token_validity = 30
  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  prevent_user_existence_errors = "ENABLED"
  enable_token_revocation       = true
}

resource "aws_cognito_user_group" "roles" {
  for_each     = toset(["admin", "trainer", "college", "partner", "student"])
  name         = each.key
  user_pool_id = aws_cognito_user_pool.main.id
}
