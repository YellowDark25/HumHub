# HumHub 1.18.5 — dump local. REST >= 0.12 exige 1.19 (User::image).
# /opt/modules-custom fica fora do volume /data; o entrypoint copia para /data/modules-custom.
FROM humhub/humhub:1.18.5

COPY modules-custom /opt/modules-custom
COPY modules-custom/nexchat /opt/humhub/protected/modules/nexchat
COPY modules-custom/chatwoot /opt/humhub/protected/modules/chatwoot
COPY caddy/railway-edge.caddyfile /etc/caddy/Caddyfile.d/railway-edge.caddyfile
COPY docker/railway-entrypoint.sh /opt/railway-entrypoint.sh
COPY docker/railway-enable-modules.sh /opt/railway-enable-modules.sh
COPY docker/railway-import-local-db.sh /opt/railway-import-local-db.sh
COPY docker/railway-run-migrations.sh /opt/railway-run-migrations.sh
COPY docker/humhub-local.sql.gz /opt/humhub-local.sql.gz

RUN chmod +x /opt/railway-entrypoint.sh /opt/railway-enable-modules.sh /opt/railway-import-local-db.sh /opt/railway-run-migrations.sh \
    && (command -v curl >/dev/null 2>&1 || (apt-get update && apt-get install -y --no-install-recommends curl ca-certificates)) \
    && mkdir -p /tmp/rest-src \
    && curl -fsSL https://github.com/humhub/rest/archive/refs/tags/v0.11.5.tar.gz \
      | tar -xz --strip-components=1 -C /tmp/rest-src \
    && rm -rf /opt/modules-custom/rest \
    && mv /tmp/rest-src /opt/modules-custom/rest \
    && cp -a /opt/modules-custom/rest /opt/humhub/protected/modules/rest

ENTRYPOINT ["/opt/railway-entrypoint.sh"]
