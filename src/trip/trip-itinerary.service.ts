import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TripItinerary, ItineraryActivity } from './trip-itinerary.entity';
import { Trip } from './trip.entity';
import { CreateItineraryInput, UpdateItineraryInput, CreateActivityInput, UpdateActivityInput } from './dto/itinerary.input';
import { ItineraryStatsResponse, ActivityScheduleConflict } from './dto/itinerary.response';

@Injectable()
export class ItineraryService {
  constructor(
    @InjectRepository(TripItinerary) private itineraryRepository: Repository<TripItinerary>,
    @InjectRepository(ItineraryActivity) private activityRepository: Repository<ItineraryActivity>,
    @InjectRepository(Trip) private tripRepository: Repository<Trip>,
  ) {}

  // ==================== Itinerary Methods ====================

  async createItinerary(input: CreateItineraryInput, userId: string): Promise<TripItinerary> {
    const trip = await this.tripRepository.findOne({
      where: { id: input.tripId },
      relations: ['user'],
    });
    if (!trip) {
      throw new NotFoundException(`Trip with ID ${input.tripId} not found`);
    }

    // Verify ownership or edit permission (via TripService)
    if (trip.user.id !== userId) {
      throw new ForbiddenException('You do not have permission to modify this trip');
    }

    // Validate day number within trip duration
    const startDate = new Date(trip.start_date);
    const endDate = new Date(trip.end_date);
    const dayCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (input.dayNumber < 1 || input.dayNumber > dayCount) {
      throw new BadRequestException(`Day number must be between 1 and ${dayCount}`);
    }

    // Validate date matches trip dates
    const inputDate = new Date(input.date);
    const expectedDate = new Date(startDate);
    expectedDate.setDate(expectedDate.getDate() + input.dayNumber - 1);

    if (inputDate.toDateString() !== expectedDate.toDateString()) {
      throw new BadRequestException('Provided date does not match the day number for this trip');
    }

    const itinerary = this.itineraryRepository.create({
      trip,
      dayNumber: input.dayNumber,
      date: inputDate,
      title: input.title,
      description: input.description,
    });

    return this.itineraryRepository.save(itinerary);
  }

  async updateItinerary(input: UpdateItineraryInput, userId: string): Promise<TripItinerary> {
    const itinerary = await this.itineraryRepository.findOne({
      where: { id: input.id },
      relations: ['trip', 'trip.user'],
    });
    if (!itinerary) {
      throw new NotFoundException(`Itinerary with ID ${input.id} not found`);
    }

    // Verify permission
    if (itinerary.trip.user.id !== userId) {
      throw new ForbiddenException('You do not have permission to modify this itinerary');
    }

    if (input.title !== undefined) itinerary.title = input.title;
    if (input.description !== undefined) itinerary.description = input.description;

    return this.itineraryRepository.save(itinerary);
  }

  async deleteItinerary(itineraryId: string, userId: string): Promise<boolean> {
    const itinerary = await this.itineraryRepository.findOne({
      where: { id: itineraryId },
      relations: ['trip', 'trip.user'],
    });
    if (!itinerary) {
      throw new NotFoundException(`Itinerary with ID ${itineraryId} not found`);
    }

    // Verify permission
    if (itinerary.trip.user.id !== userId) {
      throw new ForbiddenException('You do not have permission to delete this itinerary');
    }

    await this.itineraryRepository.remove(itinerary);
    return true;
  }

  async getTripItineraries(tripId: string): Promise<TripItinerary[]> {
    const trip = await this.tripRepository.findOne({ where: { id: tripId } });
    if (!trip) {
      throw new NotFoundException(`Trip with ID ${tripId} not found`);
    }

    return this.itineraryRepository.find({
      where: { trip: { id: tripId } },
      relations: ['activities'],
      order: { dayNumber: 'ASC' },
    });
  }

  async getItineraryByDay(tripId: string, dayNumber: number): Promise<TripItinerary> {
    const itinerary = await this.itineraryRepository.findOne({
      where: { trip: { id: tripId }, dayNumber },
      relations: ['activities'],
    });
    if (!itinerary) {
      throw new NotFoundException(`No itinerary found for day ${dayNumber}`);
    }
    return itinerary;
  }

  // ==================== Activity Methods ====================

  async createActivity(input: CreateActivityInput, userId: string): Promise<ItineraryActivity> {
    const itinerary = await this.itineraryRepository.findOne({
      where: { id: input.itineraryId },
      relations: ['trip', 'trip.user', 'activities'],
    });
    if (!itinerary) {
      throw new NotFoundException(`Itinerary with ID ${input.itineraryId} not found`);
    }

    // Verify permission
    if (itinerary.trip.user.id !== userId) {
      throw new ForbiddenException('You do not have permission to modify this itinerary');
    }

    // Validate time format (HH:MM)
    this.validateTimeFormat(input.startTime);
    this.validateTimeFormat(input.endTime);

    // Validate time range
    if (!this.isValidTimeRange(input.startTime, input.endTime)) {
      throw new BadRequestException('End time must be after start time');
    }

    // Check for time conflicts
    const conflicts = this.checkTimeConflicts(itinerary.activities || [], input.startTime, input.endTime);
    if (conflicts.length > 0) {
      throw new BadRequestException(`Time conflict detected with ${conflicts.length} activity(ies)`);
    }

    const activity = this.activityRepository.create({
      itinerary,
      title: input.title,
      description: input.description,
      startTime: input.startTime,
      endTime: input.endTime,
      location: input.location,
      placeId: input.placeId,
      category: input.category,
      notes: input.notes,
      estimatedCost: input.estimatedCost,
      priority: input.priority,
    });

    return this.activityRepository.save(activity);
  }

  async updateActivity(input: UpdateActivityInput, userId: string): Promise<ItineraryActivity> {
    const activity = await this.activityRepository.findOne({
      where: { id: input.id },
      relations: ['itinerary', 'itinerary.trip', 'itinerary.trip.user', 'itinerary.activities'],
    });
    if (!activity) {
      throw new NotFoundException(`Activity with ID ${input.id} not found`);
    }

    // Verify permission
    if (activity.itinerary.trip.user.id !== userId) {
      throw new ForbiddenException('You do not have permission to modify this activity');
    }

    // If updating time, check for conflicts
    if (input.startTime || input.endTime) {
      const startTime = input.startTime || activity.startTime;
      const endTime = input.endTime || activity.endTime;

      this.validateTimeFormat(startTime);
      this.validateTimeFormat(endTime);

      if (!this.isValidTimeRange(startTime, endTime)) {
        throw new BadRequestException('End time must be after start time');
      }

      // Check conflicts with other activities (excluding self)
      const otherActivities = (activity.itinerary.activities || []).filter(a => a.id !== activity.id);
      const conflicts = this.checkTimeConflicts(otherActivities, startTime, endTime);
      if (conflicts.length > 0) {
        throw new BadRequestException(`Time conflict detected with ${conflicts.length} activity(ies)`);
      }

      activity.startTime = startTime;
      activity.endTime = endTime;
    }

    // Update other fields
    if (input.title !== undefined) activity.title = input.title;
    if (input.description !== undefined) activity.description = input.description;
    if (input.location !== undefined) activity.location = input.location;
    if (input.placeId !== undefined) activity.placeId = input.placeId;
    if (input.category !== undefined) activity.category = input.category;
    if (input.notes !== undefined) activity.notes = input.notes;
    if (input.estimatedCost !== undefined) activity.estimatedCost = input.estimatedCost;
    if (input.isCompleted !== undefined) activity.isCompleted = input.isCompleted;
    if (input.priority !== undefined) activity.priority = input.priority;

    return this.activityRepository.save(activity);
  }

  async deleteActivity(activityId: string, userId: string): Promise<boolean> {
    const activity = await this.activityRepository.findOne({
      where: { id: activityId },
      relations: ['itinerary', 'itinerary.trip', 'itinerary.trip.user'],
    });
    if (!activity) {
      throw new NotFoundException(`Activity with ID ${activityId} not found`);
    }

    // Verify permission
    if (activity.itinerary.trip.user.id !== userId) {
      throw new ForbiddenException('You do not have permission to delete this activity');
    }

    await this.activityRepository.remove(activity);
    return true;
  }

  async getItineraryActivities(itineraryId: string): Promise<ItineraryActivity[]> {
    return this.activityRepository.find({
      where: { itinerary: { id: itineraryId } },
      order: { startTime: 'ASC' },
    });
  }

  async markActivityComplete(activityId: string, userId: string): Promise<ItineraryActivity> {
    const activity = await this.activityRepository.findOne({
      where: { id: activityId },
      relations: ['itinerary', 'itinerary.trip', 'itinerary.trip.user'],
    });
    if (!activity) {
      throw new NotFoundException(`Activity with ID ${activityId} not found`);
    }

    // Verify permission
    if (activity.itinerary.trip.user.id !== userId) {
      throw new ForbiddenException('You do not have permission to modify this activity');
    }

    activity.isCompleted = true;
    return this.activityRepository.save(activity);
  }

  async reorderActivities(itineraryId: string, activityIds: string[], userId: string): Promise<ItineraryActivity[]> {
    const itinerary = await this.itineraryRepository.findOne({
      where: { id: itineraryId },
      relations: ['trip', 'trip.user', 'activities'],
    });
    if (!itinerary) {
      throw new NotFoundException(`Itinerary with ID ${itineraryId} not found`);
    }

    // Verify permission
    if (itinerary.trip.user.id !== userId) {
      throw new ForbiddenException('You do not have permission to modify this itinerary');
    }

    // Validate all activities belong to this itinerary
    const allActivities = await this.activityRepository.find({
      where: { itinerary: { id: itineraryId } },
    });

    for (const activityId of activityIds) {
      if (!allActivities.find(a => a.id === activityId)) {
        throw new BadRequestException(`Activity ${activityId} does not belong to this itinerary`);
      }
    }

    // Sort by provided order
    const sortedActivities = activityIds.map(id => allActivities.find(a => a.id === id)!);
    return sortedActivities;
  }

  // ==================== Scheduling Utilities ====================

  private validateTimeFormat(time: string): boolean {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      throw new BadRequestException(`Invalid time format: ${time}. Expected HH:MM`);
    }
    return true;
  }

  private isValidTimeRange(startTime: string, endTime: string): boolean {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const startTotalMins = startHour * 60 + startMin;
    const endTotalMins = endHour * 60 + endMin;

    return endTotalMins > startTotalMins;
  }

  private checkTimeConflicts(activities: ItineraryActivity[], startTime: string, endTime: string): ItineraryActivity[] {
    const [newStart] = startTime.split(':').map(Number);
    const [newEnd] = endTime.split(':').map(Number);

    const newStartMins = newStart * 60;
    const newEndMins = newEnd * 60;

    return activities.filter(activity => {
      const [actStart] = activity.startTime.split(':').map(Number);
      const [actEnd] = activity.endTime.split(':').map(Number);

      const actStartMins = actStart * 60;
      const actEndMins = actEnd * 60;

      // Check if time ranges overlap
      return (newStartMins < actEndMins) && (newEndMins > actStartMins);
    });
  }

  private getTimeInMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // ==================== Statistics Methods ====================

  async getItineraryStats(itineraryId: string): Promise<ItineraryStatsResponse> {
    const itinerary = await this.itineraryRepository.findOne({
      where: { id: itineraryId },
      relations: ['activities'],
    });
    if (!itinerary) {
      throw new NotFoundException(`Itinerary with ID ${itineraryId} not found`);
    }

    const activities = itinerary.activities || [];
    const totalActivities = activities.length;
    const completedActivities = activities.filter(a => a.isCompleted).length;
    const totalEstimatedCost = activities.reduce((sum, a) => sum + (Number(a.estimatedCost) || 0), 0);

    const categories = new Set<string>();
    activities.forEach(a => {
      if (a.category) categories.add(a.category);
    });

    let firstActivityTime = '00:00';
    let lastActivityTime = '23:59';
    let scheduleUtilization = 0;

    if (activities.length > 0) {
      const sortedByTime = activities.sort((a, b) =>
        this.getTimeInMinutes(a.startTime) - this.getTimeInMinutes(b.startTime)
      );
      firstActivityTime = sortedByTime[0].startTime;
      lastActivityTime = sortedByTime[sortedByTime.length - 1].endTime;

      // Calculate schedule utilization
      const firstMins = this.getTimeInMinutes(firstActivityTime);
      const lastMins = this.getTimeInMinutes(lastActivityTime);
      const dayMins = 24 * 60;
      scheduleUtilization = Math.round(((lastMins - firstMins) / dayMins) * 100);
    }

    return {
      dayNumber: itinerary.dayNumber,
      date: itinerary.date,
      totalActivities,
      completedActivities,
      totalEstimatedCost,
      firstActivityTime,
      lastActivityTime,
      categories: Array.from(categories),
      scheduleUtilization,
    };
  }

  async getTripItineraryStats(tripId: string): Promise<ItineraryStatsResponse[]> {
    const itineraries = await this.getTripItineraries(tripId);
    const stats = await Promise.all(itineraries.map(it => this.getItineraryStats(it.id)));
    return stats;
  }
}
