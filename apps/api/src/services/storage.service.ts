import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const isLocalDev = !process.env["R2_ACCOUNT_ID"];
const API_BASE = (process.env["API_BASE_URL"] ?? "http://localhost:3000").replace(/\/$/, "");

export class StorageService {
  private readonly client!: S3Client;
  private readonly bucket!: string;
  private readonly publicUrl!: string;

  constructor() {
    if (!isLocalDev) {
      this.client = new S3Client({
        region: "auto",
        endpoint: `https://${process.env["R2_ACCOUNT_ID"]}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env["R2_ACCESS_KEY_ID"] ?? "",
          secretAccessKey: process.env["R2_SECRET_ACCESS_KEY"] ?? "",
        },
      });
      this.bucket = process.env["R2_BUCKET_NAME"] ?? "";
      this.publicUrl = (process.env["R2_PUBLIC_URL"] ?? "").replace(/\/$/, "");
    }
  }

  getPresignedUploadUrl(key: string, contentType: string, ttlSeconds = 300): Promise<string> {
    if (isLocalDev) {
      return Promise.resolve(`${API_BASE}/dev-upload/${key}`);
    }
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.client, command, { expiresIn: ttlSeconds });
  }

  publicUrlFor(key: string): string {
    if (isLocalDev) return `${API_BASE}/uploads/${key}`;
    return `${this.publicUrl}/${key}`;
  }
}
