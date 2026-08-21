import { APP_NAME } from "@/shared/appName";
import { BRAND } from "@/shared/brand";
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: `App mobile do ${APP_NAME}`,
    start_url: "/",
    display: "standalone",
    background_color: BRAND.antiFlash,
    theme_color: BRAND.oxford,
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
