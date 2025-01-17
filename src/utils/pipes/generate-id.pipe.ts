import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';
import { nanoid } from 'nanoid';

@Injectable()
export default class GenerateIDPipe implements PipeTransform {
  transform(value: Record<string, any>) {
    if (value.id && value.id.trim() !== '') {
      throw new BadRequestException('The "id" field must be empty.');
    }

    value.id = nanoid();
    return value;
  }
}
