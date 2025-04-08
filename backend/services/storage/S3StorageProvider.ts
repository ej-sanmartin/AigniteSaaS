import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageProvider } from './StorageProvider';

const s3 = new S3Client({ 
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

const bucket = process.env.AWS_BUCKET_NAME;

export class S3StorageProvider implements StorageProvider {
  async upload(buffer: Buffer, key: string): Promise<string> {
    try {
      await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: 'image/jpeg',
        ACL: 'private',
        ServerSideEncryption: 'AES256',
      }));
      return key;
    } catch (error) {
      console.error('Error uploading to S3:', error);
      throw new Error('Failed to upload file to storage');
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 900): Promise<string> {
    try {
      const command = new GetObjectCommand({ 
        Bucket: bucket, 
        Key: key 
      });
      return await getSignedUrl(s3, command, { expiresIn });
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw new Error('Failed to generate signed URL');
    }
  }
}

export const s3StorageProvider = new S3StorageProvider(); 