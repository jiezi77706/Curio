import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SearchService } from './search.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Get('suggest')
  suggest(@Query('q') q: string, @Query('limit') limit = '10') {
    return this.search.suggest(q, Number(limit));
  }
}
