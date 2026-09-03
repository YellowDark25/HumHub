"use client";

import { useState } from "react";

const SIZE_CLASS = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  server: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-lg",
  card: "h-20 w-20 text-xl",
  xl: "h-32 w-32 text-2xl",
} as const;

type AvatarProps = {
  name: string;
  imageUrl?: string;
  size?: keyof typeof SIZE_CLASS;
  shape?: "circle" | "square" | "squircle";
  fit?: "cover" | "contain";
};

/**
 * Foto ou iniciais do usuário/espaço.
 * `squircle` é o quadrado com raio largo dos ícones de servidor (estilo Discord).
 */
export function Avatar({
  name,
  imageUrl = "",
  size = "md",
  shape = "square",
  fit = "cover",
}: AvatarProps) {
  const [failedUrl, setFailedUrl] = useState("");
  const showImage = Boolean(imageUrl) && failedUrl !== imageUrl;
  const shapeClass =
    shape === "circle"
      ? "rounded-full"
      : shape === "squircle"
        ? "rounded-2xl"
        : "rounded-lg";
  const fitClass = fit === "contain" ? "object-contain" : "object-cover";

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-teal-100 font-semibold text-teal-800 ${SIZE_CLASS[size]} ${shapeClass}`}
    >
      {showImage ? (
        <img
          src={imageUrl}
          alt={name}
          className={`h-full w-full ${fitClass}`}
          onError={() => setFailedUrl(imageUrl)}
        />
      ) : (
        readInitials(name)
      )}
    </span>
  );
}

function readInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
