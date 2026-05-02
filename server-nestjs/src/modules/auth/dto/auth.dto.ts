import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsString()
  @MinLength(8)
  @MaxLength(64)
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  nickname?: string;
}

export class LoginDto {
  /** 邮箱或手机号 */
  @IsString()
  account!: string;

  @IsString()
  password!: string;
}
