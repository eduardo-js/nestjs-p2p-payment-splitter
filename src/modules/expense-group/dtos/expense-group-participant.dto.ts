import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsNotEmpty } from 'class-validator';

export default class ExpenseGroupParticipantDto {
  @ApiProperty({
    description: 'Name of the participant',
    example: 'user1',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Email of the participant (optional)',
    example: 'user1@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  @IsString()
  email?: string;
}
