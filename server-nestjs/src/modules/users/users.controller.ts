import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateMeDto } from './dto/update-me.dto';

@ApiTags('me')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  me(@CurrentUser() u: JwtUser) {
    return this.users.findById(u.sub);
  }

  @Patch()
  update(@CurrentUser() u: JwtUser, @Body() dto: UpdateMeDto) {
    return this.users.update(u.sub, dto);
  }
}
