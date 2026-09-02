#!/bin/sh
# Habilita REST e nexchat depois que o wizard gravou o banco.
# Espera module/list, faz flush do cache, habilita os dois módulos e registra no stdout.
set -eu

YII=/app/yii
if [ ! -e "$YII" ]; then
  YII=/app/bin/yii
fi

echo "[railway-enable] yii=$YII modules=$(ls -1 /data/modules-custom 2>/dev/null | tr '\n' ' ')"

attempt=0
while [ "$attempt" -lt 60 ]; do
  if "$YII" module/list >/tmp/hh-modules.txt 2>/tmp/hh-modules.err; then
    break
  fi
  attempt=$((attempt + 1))
  echo "[railway-enable] aguardando Yii ($attempt/60): $(head -c 200 /tmp/hh-modules.err 2>/dev/null)"
  sleep 5
done

if [ "$attempt" -ge 60 ]; then
  echo "[railway-enable] Yii não listou módulos; abortando."
  exit 1
fi

echo "[railway-enable] module/list ok"
"$YII" cache/flush-all || true
"$YII" module/enable rest || echo "[railway-enable] enable rest falhou"
"$YII" module/enable nexchat || echo "[railway-enable] enable nexchat falhou"
"$YII" settings/set rest enableJwtAuth 1 || echo "[railway-enable] JWT auth falhou"
"$YII" settings/set rest enabledForAllUsers 1 || echo "[railway-enable] JWT users falhou"
"$YII" cache/flush-all || true
"$YII" module/list || true
echo "[railway-enable] concluído"
