"use client";

import { useEffect, useState } from "react";
import { spaceBannerFallbackUrl } from "@/shared/spaceBanner";

type SpaceBannerImageProps = {
  url: string;
  name: string;
};

export function SpaceBannerImage({ url, name }: SpaceBannerImageProps) {
  const [src, setSrc] = useState(url);

  useEffect(() => {
    setSrc(url);
  }, [url]);

  if (!src) {
    return null;
  }

  const fallbackUrl = spaceBannerFallbackUrl(url);

  return (
    <img
      src={src}
      alt={`Capa de ${name}`}
      className="absolute inset-0 h-full w-full object-cover object-center"
      onError={() => {
        if (fallbackUrl && fallbackUrl !== src) {
          setSrc(fallbackUrl);
          return;
        }

        setSrc("");
      }}
    />
  );
}
