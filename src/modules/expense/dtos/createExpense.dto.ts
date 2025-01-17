import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsArray,
  IsDateString,
  ArrayNotEmpty,
  ArrayUnique,
  IsEnum,
  ValidateIf,
  IsNotEmpty,
  IsPositive,
} from 'class-validator';
import { SplitType } from '../enums';
import { Transform } from 'class-transformer';

export default class CreateExpenseDto {
  id: string;

  @ApiProperty({
    description: 'The total amount of the expense',
    example: 50,
  })
  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => parseFloat(value.toFixed(2)), { toClassOnly: true }) 
  amount: number;

  @ApiProperty({
    description: 'The name of the expense',
    example: 'Dinner with friends',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'User who paid for the expense',
    example: 'user1',
  })
  @IsString()
  @IsNotEmpty()
  paidBy: string;

  @ApiProperty({
    description: 'Users splitting the expense',
    example: ['user1', 'user2'],
  })
  @ValidateIf((dto) => dto.splitType === SplitType.PARTIAL_SPLIT)
  @IsArray()
  @ArrayUnique()
  @ArrayNotEmpty()
  splitBetween: string[];

  @ApiProperty({
    description: 'The intended split strategy for the group',
    example: 'EQUALLY',
  })
  @IsEnum(SplitType)
  @IsNotEmpty()
  splitType: SplitType;

  @ApiProperty({
    description: 'The expense group id',
  })
  @IsNotEmpty()
  @IsString()
  expenseGroupId: string;

  @ApiProperty({
    description: 'The timestamp when the expense was created',
    example: '2025-01-14T12:00:00.000Z',
  })
  @IsDateString()
  createdAt: string;
}
