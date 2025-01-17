import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export default class FileFormatValidation implements PipeTransform {
  private readonly allowedExtensions: string[];
  constructor(allowedExtensions: string[]) {
    this.allowedExtensions = allowedExtensions;
  }
  transform(value: Express.Multer.File, _: ArgumentMetadata) {
    if (!value || !value.originalname) {
      throw new BadRequestException('File is required');
    }

    if (!this.allowedExtensions.includes(value.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed extensions are: ${this.allowedExtensions.join(', ')}`,
      );
    }

    return value;
  }
}
