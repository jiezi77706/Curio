import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsISO8601,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export enum EventSort {
  StartsAt = 'starts_at',
  Popularity = 'popularity',
  Relevance = 'relevance',
  Distance = 'distance',
}

export enum PriceFilter {
  Any = 'any',
  Free = 'free',
  Paid = 'paid',
}

export class ListEventsDto extends PaginationDto {
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() city?: string;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) =>
    Array.isArray(value) ? value : String(value).split(',').filter(Boolean),
  )
  @IsString({ each: true })
  tags?: string[];

  @IsOptional() @IsLongitude() @Type(() => Number) lng?: number;
  @IsOptional() @IsLatitude() @Type(() => Number) lat?: number;
  @IsOptional() @IsNumber() @Type(() => Number) radius_km?: number;

  @IsOptional() @IsISO8601() date_from?: string;
  @IsOptional() @IsISO8601() date_to?: string;

  @IsOptional() @IsEnum(PriceFilter) price?: PriceFilter;
  @IsOptional() @IsEnum(EventSort) sort?: EventSort;
}
