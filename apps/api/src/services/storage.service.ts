import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export class StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor() {
    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID ?? ""}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
      },
    });
    this.bucket = process.env.R2_BUCKET_NAME ?? "";
    this.publicUrl = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");
  }

  getPresignedUploadUrl(key: string, contentType: string, ttlSeconds = 300): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.client, command, { expiresIn: ttlSeconds });
  }

  publicUrlFor(key: string): string {
    return `${this.publicUrl}/${key}`;
  }
}
