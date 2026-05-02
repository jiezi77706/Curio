import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { ListEventsDto } from './dto/list-events.dto';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Get()
  list(@Query() q: ListEventsDto) {
    return this.events.list(q);
  }

  @Get('featured')
  featured() {
    return this.events.featured();
  }

  @Get(':idOrSlug')
  detail(@Param('idOrSlug') idOrSlug: string) {
    return this.events.detail(idOrSlug);
  }

  @Get(':id/related')
  related(@Param('id') id: string) {
    return this.events.related(id);
  }
}
