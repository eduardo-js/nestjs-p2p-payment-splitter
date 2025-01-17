import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export default class SettleDebtDto {
  @ApiProperty({
    description: 'The user who is paying',
    example: 'user1',
  })
  @IsString()
  @IsNotEmpty()
  payer: string;

  @ApiProperty({
    description: 'The user who is receiving payment',
    example: 'user2',
  })
  @IsString()
  @IsNotEmpty()
  payee: string;

  @ApiProperty({
    description: 'Amount to pay',
    example: 50,
  })
  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  amount: number;
}
