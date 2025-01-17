import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import ExpenseGroupParticipantDto from './expense-group-participant.dto';
import { Type } from 'class-transformer';
import { IsArrayUniqueName } from '@/utils/validators';

export default class CreateExpenseGroupDto {
  id: string;
  @ApiProperty({
    description: 'Name of the expense group',
    example: 'Groceries',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Users that participate in this expense group',
    type: [ExpenseGroupParticipantDto],
    example: [{ name: 'user1', email: 'user1@example.com' }, { name: 'user2' }],
  })
  @IsArray()
  @ArrayMinSize(2)
  @IsArrayUniqueName()
  @ValidateNested({ each: true })
  @Type(() => ExpenseGroupParticipantDto)
  participants: ExpenseGroupParticipantDto[];
}
