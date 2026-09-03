#!/bin/sh
# Aplica migrations pendentes do HumHub após importar um dump antigo.
# Garante colunas novas (ex.: user.user_source no 1.19) antes do supervisord subir.
set -eu

YII=/app/yii
if [ ! -e "$YII" ]; then
  YII=/app/bin/yii
fi

if [ ! -x "$YII" ] && [ ! -f "$YII" ]; then
  echo "[railway-migrate] yii não encontrado; pulando"
  exit 0
fi

attempt=0
while [ "$attempt" -lt 30 ]; do
  if "$YII" migrate/up --interactive=0 >/tmp/hh-migrate.txt 2>/tmp/hh-migrate.err; then
    echo "[railway-migrate] concluído"
    tail -n 5 /tmp/hh-migrate.txt 2>/dev/null || true
    exit 0
  fi
  attempt=$((attempt + 1))
  echo "[railway-migrate] aguardando banco ($attempt/30): $(head -c 200 /tmp/hh-migrate.err 2>/dev/null)"
  sleep 5
done

echo "[railway-migrate] falhou após 30 tentativas"
cat /tmp/hh-migrate.err 2>/dev/null || true
exit 1
