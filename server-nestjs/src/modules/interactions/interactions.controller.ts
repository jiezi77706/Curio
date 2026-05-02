import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InteractionsService } from './interactions.service';
import { TrackDto } from './dto/track.dto';

@ApiTags('track')
@Controller('track')
export class InteractionsController {
  constructor(private readonly svc: InteractionsService) {}

  @Post()
  track(@Body() dto: TrackDto) {
    return this.svc.enqueue(dto);
  }
}
