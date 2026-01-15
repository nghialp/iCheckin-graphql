import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from './trip.entity';
import { TripService } from './trip.service';
import { TripResolver } from './trip.resolver';
import { TripItinerary, ItineraryActivity } from './trip-itinerary.entity';
import { ItineraryService } from './trip-itinerary.service';
import { ItineraryResolver } from './trip-itinerary.resolver';
import { Post } from 'src/post/post.entity';
import { Place } from 'src/place/place.entity';
import { TripCollaborator } from './trip-collaborator.entity';
import { User } from 'src/user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Trip, Post, Place, TripCollaborator, User, TripItinerary, ItineraryActivity])],
  providers: [TripService, TripResolver, ItineraryService, ItineraryResolver],
  exports: [TripService, ItineraryService],
})
export class TripModule {}
