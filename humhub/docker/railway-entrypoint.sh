#!/bin/sh
# Arranque no Railway: limpa configs quebradas no volume, copia módulos
# da imagem para /data/modules-custom (autoload oficial) e sobe o supervisord.
set -eu

unset HUMHUB_CONFIG__COMPONENTS__REQUEST__TRUSTEDHOSTS || true

if [ -d /data ]; then
  mkdir -p /data/runtime /data/uploads /data/logs /data/modules /data/modules-custom
  chmod -R a+rwX /data || true
  find /data/config /data/runtime -type f \( -name '*.php' -o -name '*.env' -o -name '*.json' -o -name '*.yml' \) 2>/dev/null \
    | while IFS= read -r file; do
        if grep -qi 'trustedhosts' "$file" 2>/dev/null; then
          sed -i '/trustedhosts/Id' "$file" || true
        fi
      done
fi

if [ -d /opt/modules-custom ]; then
  for src in /opt/modules-custom/*; do
    [ -d "$src" ] || continue
    id=$(basename "$src")
    rm -rf "/data/modules-custom/$id"
    cp -a "$src" "/data/modules-custom/$id"
  done
  chmod -R a+rX /data/modules-custom || true
fi

if [ -x /opt/railway-enable-modules.sh ]; then
  /opt/railway-enable-modules.sh &
fi

if [ -x /usr/bin/supervisord ]; then
  exec /usr/bin/supervisord -n -c /etc/supervisor/supervisord.conf
fi

exec supervisord -n
