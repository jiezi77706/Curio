import {
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';
import { FavoritesService } from './favorites.service';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('favorites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me/favorites')
export class FavoritesController {
  constructor(private readonly fav: FavoritesService) {}

  @Get()
  list(@CurrentUser() u: JwtUser, @Query() p: PaginationDto) {
    return this.fav.list(u.sub, p);
  }

  @Put(':eventId')
  add(@CurrentUser() u: JwtUser, @Param('eventId') eventId: string) {
    return this.fav.add(u.sub, eventId);
  }

  @Delete(':eventId')
  remove(@CurrentUser() u: JwtUser, @Param('eventId') eventId: string) {
    return this.fav.remove(u.sub, eventId);
  }
}
