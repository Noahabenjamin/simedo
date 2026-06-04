import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Cloudflare R2 wrapper. R2 speaks S3, so we use the AWS SDK with R2's
// endpoint and treat the region as "auto". Reads env at call-time so the
// rest of the app can render fallback UI when R2 isn't configured instead
// of failing at module-load.

export type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl: string;
};

export function getR2Config(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET ?? "helix-trajectories";
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!accountId || !accessKeyId || !secretAccessKey || !publicUrl) {
    return null;
  }
  return { accountId, accessKeyId, secretAccessKey, bucket, publicUrl };
}

export function isR2Configured(): boolean {
  return getR2Config() !== null;
}

let _client: S3Client | null = null;

export function getR2Client(): S3Client | null {
  const cfg = getR2Config();
  if (!cfg) return null;
  if (_client) return _client;
  _client = new S3Client({
    region: "auto",
    endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
  });
  return _client;
}

// 10-minute uploads, 1-hour downloads — short enough that a leaked URL
// doesn't outlive the session, long enough to scrub a trajectory.
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 600,
): Promise<{ url: string; key: string } | null> {
  const client = getR2Client();
  const cfg = getR2Config();
  if (!client || !cfg) return null;
  const url = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn },
  );
  return { url, key };
}

export async function getPresignedDownloadUrl(
  key: string,
  expiresIn = 3600,
): Promise<string | null> {
  const client = getR2Client();
  const cfg = getR2Config();
  if (!client || !cfg) return null;
  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: cfg.bucket, Key: key }),
    { expiresIn },
  );
}

// Public URL — works only if the bucket has a public binding (or is fronted
// by a Worker / R2 custom domain). Used by the viewer for streaming reads.
export function getPublicUrl(key: string): string | null {
  const cfg = getR2Config();
  if (!cfg) return null;
  return `${cfg.publicUrl.replace(/\/+$/, "")}/${key}`;
}

// Strip our `r2://<bucket>/<key>` convention back to a key the viewer can
// turn into a public or signed URL. Tolerates either form.
export function r2KeyFromUrl(url: string): string | null {
  if (!url) return null;
  if (url.startsWith("r2://")) {
    const stripped = url.slice("r2://".length);
    const slash = stripped.indexOf("/");
    if (slash < 0) return null;
    return stripped.slice(slash + 1);
  }
  // Fall back: assume the public URL prefix and slice it off.
  const cfg = getR2Config();
  if (cfg && url.startsWith(cfg.publicUrl)) {
    return url.slice(cfg.publicUrl.length).replace(/^\/+/, "");
  }
  return null;
}
