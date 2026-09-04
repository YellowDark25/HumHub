#!/bin/sh
# Aplica migrations pendentes e corrige colunas do core que o dump antigo não traz.
# O Yii pode responder "up-to-date" mesmo sem user.user_source (módulos novos no migration).
set -eu

YII=/app/yii
if [ ! -e "$YII" ]; then
  YII=/app/bin/yii
fi

if [ ! -f "$YII" ]; then
  echo "[railway-migrate] yii não encontrado; pulando"
  exit 0
fi

attempt=0
while [ "$attempt" -lt 30 ]; do
  if "$YII" migrate/up --interactive=0 >/tmp/hh-migrate.txt 2>/tmp/hh-migrate.err; then
    echo "[railway-migrate] yii migrate concluído"
    tail -n 5 /tmp/hh-migrate.txt 2>/dev/null || true
    break
  fi
  attempt=$((attempt + 1))
  echo "[railway-migrate] aguardando banco ($attempt/30): $(head -c 200 /tmp/hh-migrate.err 2>/dev/null)"
  sleep 5
done

if [ "$attempt" -ge 30 ]; then
  echo "[railway-migrate] yii migrate falhou após 30 tentativas"
  cat /tmp/hh-migrate.err 2>/dev/null || true
  exit 1
fi

dsn="${HUMHUB_CONFIG__COMPONENTS__DB__DSN:-}"
db_user="${HUMHUB_CONFIG__COMPONENTS__DB__USERNAME:-}"
db_pass="${HUMHUB_CONFIG__COMPONENTS__DB__PASSWORD:-}"
host=$(printf '%s' "$dsn" | sed -n 's/.*host=\([^;]*\).*/\1/p')
port=$(printf '%s' "$dsn" | sed -n 's/.*port=\([^;]*\).*/\1/p')
dbname=$(printf '%s' "$dsn" | sed -n 's/.*dbname=\([^;]*\).*/\1/p')
port="${port:-3306}"

if [ -z "$host" ] || [ -z "$dbname" ] || [ -z "$db_user" ]; then
  echo "[railway-migrate] DSN incompleto; pulando patch SQL"
  exit 0
fi

if ! command -v mariadb >/dev/null 2>&1 && ! command -v mysql >/dev/null 2>&1; then
  apt-get update
  apt-get install -y --no-install-recommends mariadb-client
fi

if command -v mariadb >/dev/null 2>&1; then
  CLIENT=mariadb
else
  CLIENT=mysql
fi

client_args="--host=$host --port=$port --user=$db_user --password=$db_pass --skip-ssl"

has_user_source=$("$CLIENT" $client_args "$dbname" -N -e \
  "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user' AND COLUMN_NAME = 'user_source';")

if [ "$has_user_source" = "0" ]; then
  echo "[railway-migrate] criando coluna user.user_source"
  "$CLIENT" $client_args "$dbname" -e \
    "ALTER TABLE \`user\` ADD COLUMN \`user_source\` varchar(50) NOT NULL DEFAULT 'local' AFTER \`auth_mode\`;
     UPDATE \`user\` SET \`user_source\` = \`auth_mode\` WHERE \`auth_mode\` = 'ldap';"
else
  echo "[railway-migrate] coluna user.user_source já existe"
fi

if "$CLIENT" $client_args "$dbname" -N -e \
  "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'log';" | grep -qx '1'; then
  echo "[railway-migrate] esvaziando tabela log (não é dado de usuário)"
  "$CLIENT" $client_args "$dbname" -e "TRUNCATE TABLE \`log\`;"
fi

echo "[railway-migrate] concluído"
