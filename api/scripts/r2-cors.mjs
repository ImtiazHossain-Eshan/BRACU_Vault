#!/usr/bin/env node
/** Set CORS on the public files bucket so pdf.js / doc viewers can fetch
 *  cross-origin from the site. Run with R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY. */
import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";

const ACCOUNT = process.env.R2_ACCOUNT_ID || "2f2ceab58633fe8413e356a80cb463e7";
const BUCKET = process.env.R2_BUCKET || "bracu-vault-files";
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${ACCOUNT}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

await s3.send(new PutBucketCorsCommand({
  Bucket: BUCKET,
  CORSConfiguration: {
    CORSRules: [{
      AllowedOrigins: [
        "https://bracuvault.me",
        "https://www.bracuvault.me",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
      ],
      AllowedMethods: ["GET", "HEAD"],
      AllowedHeaders: ["*"],
      ExposeHeaders: ["Content-Length", "Content-Type", "Content-Range", "Accept-Ranges"],
      MaxAgeSeconds: 86400,
    }],
  },
}));
console.log(`CORS applied to ${BUCKET}`);
