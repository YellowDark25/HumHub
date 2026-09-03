#!/bin/sh
# Importa uma vez o dump do HumHub local para o MySQL do Railway.
# Lê o DSN do próprio serviço, restaura o gzip e troca localhost pelo domínio público.
set -eu

DUMP=/opt/humhub-local.sql.gz
MARKER=/data/.local-db-imported

if [ ! -f "$DUMP" ]; then
  echo "[railway-import] sem dump; pulando"
  exit 0
fi

if [ -f "$MARKER" ]; then
  echo "[railway-import] já importado; pulando"
  exit 0
fi

dsn="${HUMHUB_CONFIG__COMPONENTS__DB__DSN:-}"
user="${HUMHUB_CONFIG__COMPONENTS__DB__USERNAME:-}"
pass="${HUMHUB_CONFIG__COMPONENTS__DB__PASSWORD:-}"
host=$(printf '%s' "$dsn" | sed -n 's/.*host=\([^;]*\).*/\1/p')
port=$(printf '%s' "$dsn" | sed -n 's/.*port=\([^;]*\).*/\1/p')
dbname=$(printf '%s' "$dsn" | sed -n 's/.*dbname=\([^;]*\).*/\1/p')
port="${port:-3306}"

if [ -z "$host" ] || [ -z "$dbname" ] || [ -z "$user" ]; then
  echo "[railway-import] DSN incompleto; abortando"
  exit 1
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

echo "[railway-import] restaurando dump em $dbname"
gzip -dc "$DUMP" \
  | sed -e 's/utf8mb4_uca1400_ai_ci/utf8mb4_unicode_ci/g' \
        -e 's/utf8mb4_uca1400_as_ci/utf8mb4_unicode_ci/g' \
        -e 's/utf8mb4_uca1400_as_cs/utf8mb4_unicode_ci/g' \
  | "$CLIENT" --host="$host" --port="$port" --user="$user" --password="$pass" --skip-ssl --max-allowed-packet=64M "$dbname"

base="${HUMHUB_FIXED_SETTINGS__BASE__BASE_URL:-https://nexhub-backend.up.railway.app}"
"$CLIENT" --host="$host" --port="$port" --user="$user" --password="$pass" --skip-ssl "$dbname" -e \
  "UPDATE setting SET value='${base}' WHERE name='baseUrl'; UPDATE setting SET value=REPLACE(value,'http://localhost:8090','${base}') WHERE value LIKE '%localhost:8090%';"

count=$("$CLIENT" --host="$host" --port="$port" --user="$user" --password="$pass" --skip-ssl "$dbname" -N -e "SELECT COUNT(*) FROM user;")
mkdir -p /data
date -u +"imported %Y-%m-%dT%H:%M:%SZ users=${count}" > "$MARKER"
echo "[railway-import] concluído users=${count}"
