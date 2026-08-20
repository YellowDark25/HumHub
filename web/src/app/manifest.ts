import { APP_NAME } from "@/shared/appName";
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: `App mobile do ${APP_NAME}`,
    start_url: "/",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#0f766e",
    lang: "pt-BR",
    icons: [
      {
        src: "/icon",
        sizes: "192x192",
        type: "image/png",
      },
    ],
  };
}
