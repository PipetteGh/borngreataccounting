import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiExtraModels, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@ApiExtraModels()
export class CreateUserDto {
  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Password for the user account (minimum 6 characters)',
    example: 'Secret123!',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'Role ID assigned to the user',
    example: 2,
  })
  @IsNumber()
  @IsNotEmpty()
  roleId: number;

  @ApiPropertyOptional({
    description: 'Whether the user account is active and can sign in immediately',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
