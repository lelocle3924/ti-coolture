/**
 * Client-side image compression utility.
 * Enforces resolution and quality ceilings before uploading to storage/database.
 */

export interface CompressOptions {
  maxDimension?: number;
  quality?: number;
  mimeType?: string;
}

/**
 * Compresses an image File object in the browser.
 * - Downscales to `maxDimension` while preserving aspect ratio.
 * - Converts to WebP (or fallback format) with specified quality.
 * - Safe fallback to original file on any processing failure.
 */
export async function compressImageFile(
  file: File,
  options?: CompressOptions
): Promise<File> {
  const maxDimension = options?.maxDimension ?? 1440;
  const quality = options?.quality ?? 0.84;
  const outputMime = options?.mimeType ?? "image/webp";

  // Pass through non-image or vector/animated files
  if (
    !file.type.startsWith("image/") ||
    file.type === "image/svg+xml" ||
    file.type === "image/gif"
  ) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const naturalWidth = img.naturalWidth || img.width;
      const naturalHeight = img.naturalHeight || img.height;

      if (!naturalWidth || !naturalHeight) {
        return resolve(file);
      }

      let targetWidth = naturalWidth;
      let targetHeight = naturalHeight;

      if (naturalWidth > maxDimension || naturalHeight > maxDimension) {
        if (naturalWidth >= naturalHeight) {
          targetWidth = maxDimension;
          targetHeight = Math.round((naturalHeight * maxDimension) / naturalWidth);
        } else {
          targetHeight = maxDimension;
          targetWidth = Math.round((naturalWidth * maxDimension) / naturalHeight);
        }
      } else if (file.size < 250 * 1024 && file.type === "image/webp") {
        // Already within ceiling and is already WebP
        return resolve(file);
      }

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        return resolve(file);
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return resolve(file);
          }

          const baseName = file.name.replace(/\.[^.]+$/, "");
          const extension = outputMime === "image/webp" ? "webp" : "jpg";
          const compressedFile = new File(
            [blob],
            `${baseName}.${extension}`,
            {
              type: blob.type || outputMime,
              lastModified: Date.now(),
            }
          );

          // If the original file was ALREADY WebP and compression made it larger, keep original
          if (
            file.type === "image/webp" &&
            compressedFile.size > file.size &&
            naturalWidth <= maxDimension &&
            naturalHeight <= maxDimension
          ) {
            return resolve(file);
          }

          resolve(compressedFile);
        },
        outputMime,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file); // fail-safe
    };

    img.src = objectUrl;
  });
}
