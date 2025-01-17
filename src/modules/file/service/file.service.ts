import { Inject, Injectable } from '@nestjs/common';
import { IFileService, IS3Service } from '../interfaces';

@Injectable()
export default class FileService implements IFileService {
  constructor(@Inject('S3Service') private readonly s3Service: IS3Service) {}
  async uploadFile(
    file: Express.Multer.File,
    folder: string,
    service = 'AWS',
  ): Promise<{ location: string; key: string }> {
    if (service === 'AWS') {
      return this.s3Service.uploadFile(file, folder);
    }
  }

  async getFile(fileUrl: string, service = 'AWS'): Promise<Buffer> {
    if (service === 'AWS') {
      return this.s3Service.getFileFromS3(fileUrl);
    }
  }
}
