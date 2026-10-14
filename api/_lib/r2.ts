import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

export interface PresignedUploadResult {
  originalName: string;
  r2Key: string;
  uploadUrl: string;
  publicUrl: string;
  contentType: string;
  expiresInSeconds: number;
}

export interface FileUploadRequest {
  name: string;
  type: string;
  size: number;
}

const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const MAX_FILE_SIZE_BYTES = 12 * 1024 * 1024; // 12 MB max per image
const DEFAULT_EXPIRATION_SECONDS = 900; // 15 minutes

/**
 * Returns a configured S3Client instance targeting Cloudflare R2.
 */
export function getR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Missing Cloudflare R2 environment variables (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)"
    );
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

/**
 * Generates a clean, deterministic R2 storage key.
 * Format: shops/{shopId}/products/{timestamp}-{randomHex}.{extension}
 */
export function generateR2Key(shopId: string, originalName: string, mimeType: string): string {
  const extMatch = originalName.match(/\.([a-zA-Z0-9]+)$/);
  let ext = extMatch ? extMatch[1].toLowerCase() : "";

  if (!ext) {
    if (mimeType === "image/webp") ext = "webp";
    else if (mimeType === "image/png") ext = "png";
    else if (mimeType === "image/avif") ext = "avif";
    else ext = "jpg";
  }

  const timestamp = Date.now();
  const randomHex = crypto.randomBytes(4).toString("hex");
  const sanitizedShopId = shopId.replace(/[^a-zA-Z0-9_-]/g, "");

  return `shops/${sanitizedShopId}/products/${timestamp}-${randomHex}.${ext}`;
}

/**
 * Generates presigned PUT URLs for direct browser-to-R2 upload.
 */
export async function createPresignedUploadUrls(
  shopId: string,
  files: FileUploadRequest[],
  expirationSeconds = DEFAULT_EXPIRATION_SECONDS
): Promise<PresignedUploadResult[]> {
  const bucketName = process.env.R2_BUCKET_NAME || "ti-coolture-media";
  const publicDomain = (process.env.R2_PUBLIC_DOMAIN || "").replace(/\/+$/, "");
  const s3Client = getR2Client();

  const results: PresignedUploadResult[] = [];

  for (const file of files) {
    // Validate Content-Type
    const normalizedType = file.type.toLowerCase().trim();
    if (!ALLOWED_CONTENT_TYPES.has(normalizedType)) {
      throw new Error(
        `File type "${file.type}" not allowed. Accepted: ${Array.from(ALLOWED_CONTENT_TYPES).join(", ")}`
      );
    }

    // Validate File Size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error(
        `File "${file.name}" exceeds maximum size limit of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`
      );
    }

    const r2Key = generateR2Key(shopId, file.name, normalizedType);

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: r2Key,
      ContentType: normalizedType,
      Metadata: {
        "uploaded-by": "partner-portal",
        "shop-id": shopId,
        "original-name": encodeURIComponent(file.name),
      },
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: expirationSeconds,
    });

    const publicUrl = publicDomain
      ? `${publicDomain}/${r2Key}`
      : `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${bucketName}/${r2Key}`;

    results.push({
      originalName: file.name,
      r2Key,
      uploadUrl,
      publicUrl,
      contentType: normalizedType,
      expiresInSeconds: expirationSeconds,
    });
  }

  return results;
}
