import { Controller, Get, Module } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PgService } from '../../database/pg.service';

@ApiTags('categories')
@Controller('categories')
class CategoriesController {
  constructor(private readonly db: PgService) {}

  @Get()
  list() {
    return this.db.many(
      `SELECT id, parent_id, slug, name, icon, sort_order
       FROM categories ORDER BY sort_order ASC, name ASC`,
    );
  }
}

@Module({ controllers: [CategoriesController] })
export class CategoriesModule {}
