const COMPRESSIBLE_TYPE = /^image\/(jpeg|png|webp|bmp)$/;
const MAX_IMAGE_EDGE = 1920;
const JPEG_QUALITY = 0.72;
const SKIP_UNDER_BYTES = 200 * 1024;

export async function compressUploadFiles(files: File[]): Promise<File[]> {
  return Promise.all(files.map(compressUploadFile));
}

export async function compressUploadFile(file: File): Promise<File> {
  if (!shouldCompress(file)) {
    return file;
  }

  try {
    const compressed = await compressImage(file);
    return compressed.size < file.size ? compressed : file;
  } catch {
    return file;
  }
}

function shouldCompress(file: File) {
  return COMPRESSIBLE_TYPE.test(file.type) && file.size > SKIP_UNDER_BYTES;
}

async function compressImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const size = fitInside(bitmap.width, bitmap.height, MAX_IMAGE_EDGE);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;

  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Canvas indisponível.");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, size.width, size.height);
  context.drawImage(bitmap, 0, 0, size.width, size.height);
  bitmap.close();

  const blob = await canvasToBlob(canvas);
  if (!blob) {
    throw new Error("Falha ao gerar a imagem.");
  }

  return new File([blob], withJpegName(file.name), {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

function fitInside(width: number, height: number, maxEdge: number) {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) {
    return { width, height };
  }

  const scale = maxEdge / longest;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY);
  });
}

function withJpegName(name: string) {
  return `${name.replace(/\.[a-z0-9]+$/i, "")}.jpg`;
}
