import { Type } from 'class-transformer';
import {
  IsEnum,
  IsISO8601,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export enum TrackAction {
  View = 'view',
  Click = 'click',
  Favorite = 'favorite',
  Share = 'share',
  Register = 'register',
}

class GeoDto {
  @IsLongitude() @Type(() => Number) lng!: number;
  @IsLatitude() @Type(() => Number) lat!: number;
}

export class TrackDto {
  @IsOptional() @IsUUID() user_id?: string;
  @IsOptional() @IsString() anon_id?: string;

  @IsUUID()
  event_id!: string;

  @IsEnum(TrackAction)
  action!: TrackAction;

  @IsOptional() @IsNumber() weight?: number;
  @IsOptional() @IsString() referrer?: string;
  @IsOptional() @IsISO8601() ts?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => GeoDto)
  geo?: GeoDto;
}
