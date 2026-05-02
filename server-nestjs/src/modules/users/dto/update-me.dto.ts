import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  nickname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  city?: string;
}
