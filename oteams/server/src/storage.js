// File storage on any S3-compatible backend (MinIO by default).
// Uploads use presigned PUT URLs so bytes never pass through this API server.
import { S3Client, CreateBucketCommand, HeadBucketCommand, DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { config } from "./config.js";

const s3 = new S3Client({
  region: config.s3.region,
  endpoint: config.s3.endpoint,
  forcePathStyle: config.s3.forcePathStyle,
  credentials: { accessKeyId: config.s3.accessKey, secretAccessKey: config.s3.secretKey },
});

// A second client that signs URLs against the *browser-reachable* endpoint.
const s3Public = new S3Client({
  region: config.s3.region,
  endpoint: config.s3.publicEndpoint,
  forcePathStyle: config.s3.forcePathStyle,
  credentials: { accessKeyId: config.s3.accessKey, secretAccessKey: config.s3.secretKey },
});

export async function ensureBucket() {
  if (!config.s3.accessKey) { console.warn("[storage] S3 not configured — uploads disabled"); return false; }
  try {
    await s3.send(new HeadBucketCommand({ Bucket: config.s3.bucket }));
    return true;
  } catch {
    try {
      await s3.send(new CreateBucketCommand({ Bucket: config.s3.bucket }));
      console.log(`[storage] created bucket ${config.s3.bucket}`);
      return true;
    } catch (err) {
      console.error("[storage] could not create bucket:", err.message);
      return false;
    }
  }
}

const safe = name => String(name || "file").replace(/[^\w.\-]+/g, "_").slice(0, 120);

export function buildKey(workspaceId, filename) {
  const d = new Date();
  const ym = `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  return `ws/${workspaceId}/${ym}/${randomUUID()}-${safe(filename)}`;
}

/** Presigned PUT the browser uploads to directly. */
export async function presignUpload(key, mime, expiresIn = 900) {
  const cmd = new PutObjectCommand({ Bucket: config.s3.bucket, Key: key, ContentType: mime });
  return getSignedUrl(s3Public, cmd, { expiresIn });
}

/** Presigned GET so private files are readable only via a short-lived link. */
export async function presignDownload(key, filename, expiresIn = 3600) {
  const cmd = new GetObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
    ResponseContentDisposition: filename ? `inline; filename="${safe(filename)}"` : undefined,
  });
  return getSignedUrl(s3Public, cmd, { expiresIn });
}

export async function deleteObject(key) {
  try { await s3.send(new DeleteObjectCommand({ Bucket: config.s3.bucket, Key: key })); }
  catch (err) { console.warn("[storage] delete failed", key, err.message); }
}
