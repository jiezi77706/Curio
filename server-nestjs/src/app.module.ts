import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { APP_GUARD } from '@nestjs/core';

import { envValidation } from './config/env.validation';
import { DatabaseModule } from './database/database.module';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { EventsModule } from './modules/events/events.module';
import { SearchModule } from './modules/search/search.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { InteractionsModule } from './modules/interactions/interactions.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { TagsModule } from './modules/tags/tags.module';
import { VenuesModule } from './modules/venues/venues.module';
import { OrganizersModule } from './modules/organizers/organizers.module';
import { AdminModule } from './modules/admin/admin.module';
import { CrawlerModule } from './modules/crawler/crawler.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: envValidation,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number(process.env.REDIS_PORT ?? 6379),
        password: process.env.REDIS_PASSWORD || undefined,
      },
    }),
    DatabaseModule,

    AuthModule,
    UsersModule,
    EventsModule,
    SearchModule,
    RecommendationsModule,
    FavoritesModule,
    InteractionsModule,
    CategoriesModule,
    TagsModule,
    VenuesModule,
    OrganizersModule,
    AdminModule,
    CrawlerModule,
    IngestionModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
