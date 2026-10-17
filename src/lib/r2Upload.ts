/**
 * Client-side utility for direct-to-R2 image uploads.
 * Bypasses serverless compute limits by uploading directly from browser to Cloudflare R2
 * using Presigned PUT URLs issued by /api/portal/upload-ticket.
 */

export interface UploadTicket {
  originalName: string;
  r2Key: string;
  uploadUrl: string;
  publicUrl: string;
  contentType: string;
  expiresInSeconds: number;
}

export interface UploadedR2Image {
  originalName: string;
  r2Key: string;
  publicUrl: string;
  sortOrder: number;
  isCover: boolean;
  width?: number;
  height?: number;
}

export interface UploadProgressCallback {
  (fileIndex: number, percent: number): void;
}

/**
 * Extracts width and height of an image file in the browser.
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

/**
 * Requests presigned upload tickets from backend for a list of files.
 */
export async function requestUploadTickets(
  token: string,
  files: File[]
): Promise<{ success: boolean; shopId: string; tickets: UploadTicket[] }> {
  const fileMeta = files.map((f) => ({
    name: f.name,
    type: f.type || "image/webp",
    size: f.size,
  }));

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch("/api/portal/upload-ticket", {
    method: "POST",
    headers,
    body: JSON.stringify({
      token,
      files: fileMeta,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Không thể khởi tạo vé tải ảnh lên.");
  }

  return data;
}

/**
 * Uploads a single file binary directly to Cloudflare R2 via Presigned PUT URL.
 * Tracks upload progress (0 - 100%).
 */
export function uploadFileToR2(
  file: File,
  ticket: UploadTicket,
  onProgress?: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        if (onProgress) onProgress(100);
        resolve();
      } else {
        reject(
          new Error(
            `Upload ảnh thất bại (HTTP ${xhr.status}). Vui lòng kiểm tra cấu hình CORS của Cloudflare R2.`
          )
        );
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Lỗi mạng khi tải ảnh lên R2. Vui lòng thử lại."));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Tiến trình tải ảnh bị hủy."));
    });

    xhr.open("PUT", ticket.uploadUrl);
    xhr.setRequestHeader("Content-Type", ticket.contentType);
    xhr.send(file);
  });
}

/**
 * Uploads multiple files directly to R2 with concurrency control and progress tracking.
 */
export async function uploadMultipleFilesDirectly(
  token: string,
  files: File[],
  options?: {
    onFileProgress?: (fileIndex: number, percent: number) => void;
    concurrency?: number;
  }
): Promise<UploadedR2Image[]> {
  if (files.length === 0) return [];

  // 1. Get presigned tickets
  const { tickets } = await requestUploadTickets(token, files);

  // 2. Read dimensions in parallel
  const dimensionPromises = files.map((f) => getImageDimensions(f));
  const dimensions = await Promise.all(dimensionPromises);

  // 3. Upload with concurrency pool (default: 3 concurrent uploads)
  const concurrency = options?.concurrency || 3;
  const results: UploadedR2Image[] = [];
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < files.length) {
      const idx = currentIndex++;
      const file = files[idx];
      const ticket = tickets[idx];
      const dim = dimensions[idx];

      await uploadFileToR2(file, ticket, (pct) => {
        if (options?.onFileProgress) {
          options.onFileProgress(idx, pct);
        }
      });

      results[idx] = {
        originalName: file.name,
        r2Key: ticket.r2Key,
        publicUrl: ticket.publicUrl,
        sortOrder: idx,
        isCover: idx === 0,
        width: dim.width,
        height: dim.height,
      };
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, files.length) }, () => worker());
  await Promise.all(workers);

  return results;
}
