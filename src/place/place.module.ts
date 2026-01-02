import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Place } from "./place.entity";
import { PlaceResolver } from "./place.resolver";
import { PlaceService } from "./place.service";
import { CacheModule } from "@nestjs/cache-manager";

@Module({
  imports: [TypeOrmModule.forFeature([Place]), 
    CacheModule.register({
      ttl: 60, // thời gian cache mặc định (giây)
      max: 100, // số lượng item tối đa
    }),],
  providers: [PlaceService, PlaceResolver],
  exports: [PlaceService],
})
export class PlaceModule {}