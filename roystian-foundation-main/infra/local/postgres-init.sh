#!/bin/sh
# Mirrors the RDS bootstrap (db/bootstrap.sql) for the local Postgres container.
# The container's superuser plays the RDS master user; the app never uses it.
set -e
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres \
  -v app_password="${APP_DB_PASSWORD:-roystian_local}" -f /bootstrap/bootstrap.sql
