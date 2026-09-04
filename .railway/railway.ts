import {
  defineRailway,
  mysql,
  project,
  service,
  volume,
} from "railway/iac";

/**
 * Projeto Railway do backend NexHub: MySQL gerenciado + HumHub com volume /data.
 * O Next na Vercel chama a URL pública deste HumHub via HUMHUB_URL.
 */
export default defineRailway(() => {
  const db = mysql("mysql");
  const data = volume("humhub-data", { sizeMB: 5120 });

  const humhub = service("humhub", {
    healthcheck: "/",
    healthcheckTimeout: 300,
    volumeMounts: {
      "/data": data,
    },
    env: {
      HUMHUB_DEBUG: "false",
      PORT: "8080",
      SERVER_NAME: ":8090",
      HUMHUB_FIXED_SETTINGS__BASE__BASE_URL:
        "https://${{RAILWAY_PUBLIC_DOMAIN}}",
      HUMHUB_CONFIG__COMPONENTS__DB__DSN:
        "mysql:host=${{mysql.MYSQLHOST}};port=${{mysql.MYSQLPORT}};dbname=${{mysql.MYSQLDATABASE}}",
      HUMHUB_CONFIG__COMPONENTS__DB__USERNAME: db.env.MYSQLUSER,
      HUMHUB_CONFIG__COMPONENTS__DB__PASSWORD: db.env.MYSQLPASSWORD,
      HUMHUB_CONFIG__PARAMS__MODULE_AUTOLOAD_PATHS: '["/opt/modules-custom"]',
      HUMHUB_CONFIG__COMPONENTS__LOG__TARGETS:
        '{"yii\\\\log\\\\DbTarget":{"enabled":false}}',
    },
  });

  return project("nexhub", {
    resources: [db, data, humhub],
  });
});
