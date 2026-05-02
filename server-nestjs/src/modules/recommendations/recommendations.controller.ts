import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';
import { RecommendationsService } from './recommendations.service';

@ApiTags('recommendations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me/recommendations')
export class RecommendationsController {
  constructor(private readonly reco: RecommendationsService) {}

  @Get()
  list(@CurrentUser() u: JwtUser, @Query('limit') limit = '20') {
    return this.reco.forUser(u.sub, Number(limit));
  }
}
