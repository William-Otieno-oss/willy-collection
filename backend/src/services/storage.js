// Ensure environment variables are loaded before initializing the S3 client
require("dotenv").config();

const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  CreateBucketCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const logger = require("../middleware/logger");

// S3 Configuration
const REGION =
  process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const BUCKET =
  process.env.AWS_S3_BUCKET || process.env.AWS_S3_BUCKET_NAME || "willy-bucket";
const S3_ENDPOINT =
  process.env.AWS_S3_ENDPOINT ||
  process.env.S3_ENDPOINT ||
  process.env.MINIO_ENDPOINT;

let s3client = null;

function isConfigured() {
  return !!s3client;
}

// Initialize S3 client if credentials are available
// Log presence of key environment vars (do NOT log secret values)
logger.info("S3 environment variables", {
  hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
  hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
  region: REGION,
  bucket: BUCKET,
  endpoint: S3_ENDPOINT || "",
});

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  const opts = {
    region: REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  };

  if (S3_ENDPOINT) {
    opts.endpoint = S3_ENDPOINT;
    // MinIO and some S3-compatible endpoints require path-style addressing
    opts.forcePathStyle = true;
  }

  s3client = new S3Client(opts);
  logger.info("Initialized S3 client", {
    region: REGION,
    bucket: BUCKET,
    endpoint: S3_ENDPOINT || "",
  });

  // Ensure bucket exists (best-effort, non-blocking)
  (async () => {
    try {
      if (BUCKET) {
        await s3client.send(
          new CreateBucketCommand({ Bucket: BUCKET }).catch(() => null),
        );
      }
    } catch (e) {
      // Ignore errors - bucket may already exist or not be creatable
      logger.warn("Could not create S3 bucket", { message: e.message });
    }
  })();
} else {
  logger.warn(
    "AWS credentials not configured. S3 uploads will fail. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.",
  );
}

async function uploadBufferToS3(buffer, key, contentType) {
  if (!s3client || !BUCKET) {
    throw new Error(
      "S3 not configured. Provide AWS credentials and bucket name.",
    );
  }

  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error("Invalid buffer provided");
  }

  if (!key || typeof key !== "string") {
    throw new Error("Invalid key provided");
  }

  if (!contentType || typeof contentType !== "string") {
    throw new Error("Invalid content type provided");
  }

  try {
    const cmd = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      // Try to set public read by default so URLs are accessible; if your
      // bucket blocks ACLs this will be ignored by AWS.
      ACL: "public-read",
      Metadata: {
        "upload-date": new Date().toISOString(),
      },
    });

    await s3client.send(cmd);
    // Build a stable public URL to return
    const url = getPublicUrl(key);
    return { bucket: BUCKET, key, url };
  } catch (err) {
    logger.error("S3 upload error", { message: err.message, key });
    throw new Error(`Failed to upload to S3: ${err.message}`);
  }
}

function getPublicUrl(key) {
  if (!key) return null;
  if (S3_ENDPOINT) {
    const endpoint = String(S3_ENDPOINT).replace(/\/$/, "");
    return `${endpoint}/${BUCKET}/${key}`;
  }
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}

async function getPresignedPutUrl(key, contentType, expiresSeconds = 3600) {
  if (!s3client || !BUCKET) {
    throw new Error(
      "S3 not configured. Provide AWS credentials and bucket name.",
    );
  }

  if (!key || typeof key !== "string") {
    throw new Error("Invalid key provided");
  }

  if (!contentType || typeof contentType !== "string") {
    throw new Error("Invalid content type provided");
  }

  try {
    const cmd = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3client, cmd, {
      expiresIn: Math.min(expiresSeconds, 3600), // Max 1 hour
    });

    return url;
  } catch (err) {
    logger.error("Presigned URL generation error", {
      message: err.message,
      key,
    });
    throw new Error(`Failed to generate presigned URL: ${err.message}`);
  }
}

async function headObject(key) {
  if (!s3client || !BUCKET) {
    throw new Error(
      "S3 not configured. Provide AWS credentials and bucket name.",
    );
  }

  if (!key || typeof key !== "string") {
    throw new Error("Invalid key provided");
  }

  try {
    const cmd = new HeadObjectCommand({ Bucket: BUCKET, Key: key });
    return await s3client.send(cmd);
  } catch (err) {
    logger.error("Head object error", { message: err.message, key });
    throw err;
  }
}

async function getObjectBuffer(key) {
  if (!s3client || !BUCKET) {
    throw new Error(
      "S3 not configured. Provide AWS credentials and bucket name.",
    );
  }

  if (!key || typeof key !== "string") {
    throw new Error("Invalid key provided");
  }

  try {
    const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    const res = await s3client.send(cmd);

    // res.Body is a stream (Readable) in Node.js - accumulate chunks
    const stream = res.Body;
    const chunks = [];

    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
  } catch (err) {
    logger.error("Get object error", { message: err.message, key });
    throw new Error(`Failed to get object from S3: ${err.message}`);
  }
}

async function deleteObject(key) {
  if (!s3client || !BUCKET) {
    throw new Error(
      "S3 not configured. Provide AWS credentials and bucket name.",
    );
  }

  if (!key || typeof key !== "string") {
    throw new Error("Invalid key provided");
  }

  try {
    const cmd = new DeleteObjectCommand({ Bucket: BUCKET, Key: key });
    return await s3client.send(cmd);
  } catch (err) {
    logger.error("Delete object error", { message: err.message, key });
    throw new Error(`Failed to delete object from S3: ${err.message}`);
  }
}

module.exports = {
  uploadBufferToS3,
  getPresignedPutUrl,
  headObject,
  deleteObject,
  getObjectBuffer,
  isConfigured,
  getPublicUrl,
};
