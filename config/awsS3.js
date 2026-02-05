const { S3Client } = require('@aws-sdk/client-s3');

/**
 * AWS S3 configuration helpers (configuration only — no business logic).
 * - createS3Client(opts): returns a configured S3 client (does not connect)
 * - getBucketName(): returns configured bucket name (from env)
 * - isConfigured(): returns boolean whether minimal config is present
 */

function _resolveRegion() {
  return process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
}

function _resolveEndpoint() {
  // Support LocalStack or custom endpoints via AWS_S3_ENDPOINT
  return process.env.AWS_S3_ENDPOINT || process.env.S3_ENDPOINT || null;
}

function createS3Client(opts = {}) {
  const region = _resolveRegion();
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const sessionToken = process.env.AWS_SESSION_TOKEN;

  const config = {
    region,
    ...opts,
  };

  const endpoint = _resolveEndpoint();
  if (endpoint) config.endpoint = endpoint;

  // Only include explicit credentials if provided — otherwise rely on the SDK's default provider chain
  if (accessKeyId && secretAccessKey) {
    config.credentials = { accessKeyId, secretAccessKey, sessionToken };
  }

  return new S3Client(config);
}

function getBucketName() {
  return process.env.AWS_S3_BUCKET || process.env.AWS_BUCKET || process.env.S3_BUCKET || null;
}

function isConfigured() {
  const bucket = getBucketName();
  // Consider configured if a bucket name is present and either credentials or endpoint are present
  const hasCreds = Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) || Boolean(process.env.AWS_ROLE_ARN);
  const hasEndpoint = Boolean(_resolveEndpoint());
  return Boolean(bucket && (hasCreds || hasEndpoint));
}

module.exports = { createS3Client, getBucketName, isConfigured };

