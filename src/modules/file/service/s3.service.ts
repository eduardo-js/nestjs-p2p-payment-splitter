import { Injectable, Logger } from '@nestjs/common';
import { S3 } from 'aws-sdk';

@Injectable()
export default class S3Service {
  private readonly s3: S3;
  private readonly bucketName = process.env.AWS_S3_BUCKET_NAME;

  constructor() {
    this.s3 = new S3({
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      endpoint: process.env.AWS_S3_ENDPOINT || undefined,
      s3ForcePathStyle: true,
    });
  }

  async onModuleInit() {
    try {
      await this.s3
        .createBucket({ Bucket: process.env.AWS_S3_BUCKET_NAME })
        .promise();
    } catch (error) {
      Logger.error('Error creating S3 bucket:', error);
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string,
  ): Promise<{ location: string; key: string }> {
    const ext = file.originalname.split('.');
    const fileName = `${folder}/${Date.now()}_${file.filename}.${ext[ext.length - 1]}`;
    const params: S3.PutObjectRequest = {
      Bucket: this.bucketName,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    try {
      const result = await this.s3.upload(params).promise();
      return { location: result.Location, key: result.Key };
    } catch (error) {
      Logger.error('Error uploading file to S3:', error);
      throw new Error('Failed to upload file to S3');
    }
  }
  async getFileFromS3(key: string): Promise<Buffer> {
    try {
      const result = await this.s3
        .getObject({ Bucket: this.bucketName, Key: key })
        .promise();
      return result.Body as Buffer;
    } catch (error) {
      Logger.error('Error fetching file from S3:', error);
      throw new Error('Failed to fetch file from S3');
    }
  }
}
