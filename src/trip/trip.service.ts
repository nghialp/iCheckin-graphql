import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Trip } from './trip.entity';
import { Post } from 'src/post/post.entity';
import { Place } from 'src/place/place.entity';
import { User } from 'src/user/entities/user.entity';
import { TripCollaborator, CollaboratorRole } from './trip-collaborator.entity';
import { CreateTripInput } from './dto/create-trip.input';
import { UpdateTripInput } from './dto/update-trip.input';
import { InviteCollaboratorInput, UpdateCollaboratorRoleInput } from './dto/collaborator.input';
import { TripStatsResponse } from './dto/trip.response';

@Injectable()
export class TripService {
  constructor(
    @InjectRepository(Trip) private tripRepository: Repository<Trip>,
    @InjectRepository(Post) private postRepository: Repository<Post>,
    @InjectRepository(Place) private placeRepository: Repository<Place>,
    @InjectRepository(TripCollaborator) private collaboratorRepository: Repository<TripCollaborator>,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async createTrip(createTripInput: CreateTripInput, userId: string): Promise<Trip> {
    const { title, description, start_date, end_date, locations, status } = createTripInput;

    // Validate date range
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    if (startDate > endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    const trip = this.tripRepository.create({
      title,
      description,
      start_date: startDate,
      end_date: endDate,
      locations,
      status: status || 'planning',
      user: { id: userId } as User,
    });

    return this.tripRepository.save(trip);
  }

  async updateTrip(updateTripInput: UpdateTripInput, userId: string): Promise<Trip> {
    const { id, title, description, start_date, end_date, locations, status } = updateTripInput;

    const trip = await this.tripRepository.findOne({ where: { id } });
    if (!trip) {
      throw new NotFoundException(`Trip with ID ${id} not found`);
    }

    // Check ownership
    if (trip.user.id !== userId) {
      throw new ForbiddenException('You can only update your own trips');
    }

    // Validate date range if changing dates
    if (start_date && end_date) {
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      if (startDate > endDate) {
        throw new BadRequestException('Start date must be before end date');
      }
    }

    Object.assign(trip, {
      title,
      description,
      start_date: start_date ? new Date(start_date) : trip.start_date,
      end_date: end_date ? new Date(end_date) : trip.end_date,
      locations,
      status,
    });

    return this.tripRepository.save(trip);
  }

  async deleteTrip(tripId: string, userId: string): Promise<boolean> {
    const trip = await this.tripRepository.findOne({ where: { id: tripId } });
    if (!trip) {
      throw new NotFoundException(`Trip with ID ${tripId} not found`);
    }

    // Check ownership
    if (trip.user.id !== userId) {
      throw new ForbiddenException('You can only delete your own trips');
    }

    // Remove trip reference from all associated posts
    await this.postRepository.update({ trip: { id: tripId } }, { trip: undefined });

    await this.tripRepository.remove(trip);
    return true;
  }

  async getTripById(tripId: string): Promise<Trip> {
    const trip = await this.tripRepository.findOne({
      where: { id: tripId },
      relations: ['user', 'posts'],
    });

    if (!trip) {
      throw new NotFoundException(`Trip with ID ${tripId} not found`);
    }

    return trip;
  }

  async getUserTrips(userId: string, page: number = 1, limit: number = 10): Promise<{ trips: Trip[]; total: number }> {
    const skip = (page - 1) * limit;
    const [trips, total] = await this.tripRepository.findAndCount({
      where: { user: { id: userId } },
      relations: ['user', 'posts'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { trips, total };
  }

  async getUpcomingTrips(userId: string, limit: number = 5): Promise<Trip[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.tripRepository.find({
      where: {
        user: { id: userId },
        start_date: Between(today, new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000)),
      },
      relations: ['user', 'posts'],
      order: { start_date: 'ASC' },
      take: limit,
    });
  }

  async getPastTrips(userId: string, limit: number = 5): Promise<Trip[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.tripRepository.find({
      where: {
        user: { id: userId },
        end_date: Between(new Date('1970-01-01'), today),
      },
      relations: ['user', 'posts'],
      order: { end_date: 'DESC' },
      take: limit,
    });
  }

  async getTripsByMonth(userId: string, month: number, year: number): Promise<Trip[]> {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);

    return this.tripRepository.find({
      where: {
        user: { id: userId },
        start_date: Between(startOfMonth, endOfMonth),
      },
      relations: ['user', 'posts'],
      order: { start_date: 'ASC' },
    });
  }

  async addPostToTrip(tripId: string, postId: string, userId: string): Promise<Post> {
    const trip = await this.tripRepository.findOne({ where: { id: tripId } });
    if (!trip) {
      throw new NotFoundException(`Trip with ID ${tripId} not found`);
    }

    // Check ownership
    if (trip.user.id !== userId) {
      throw new ForbiddenException('You can only add posts to your own trips');
    }

    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    // Check post ownership
    if (post.user.id !== userId) {
      throw new ForbiddenException('You can only add your own posts to a trip');
    }

    post.trip = trip;
    return this.postRepository.save(post);
  }

  async removePostFromTrip(postId: string, userId: string): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['trip'],
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    // Check post ownership
    if (post.user.id !== userId) {
      throw new ForbiddenException('You can only remove your own posts from a trip');
    }

    post.trip = undefined;
    return this.postRepository.save(post);
  }

  async getTripPosts(tripId: string): Promise<Post[]> {
    const trip = await this.tripRepository.findOne({
      where: { id: tripId },
      relations: ['posts'],
    });

    if (!trip) {
      throw new NotFoundException(`Trip with ID ${tripId} not found`);
    }

    return trip.posts || [];
  }

  async getTripStats(tripId: string): Promise<TripStatsResponse> {
    const trip = await this.tripRepository.findOne({
      where: { id: tripId },
      relations: ['posts'],
    });

    if (!trip) {
      throw new NotFoundException(`Trip with ID ${tripId} not found`);
    }

    const startDate = new Date(trip.start_date);
    const endDate = new Date(trip.end_date);
    const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    let averageCost = 0;
    let averageRating = 0;
    let postCount = 0;

    if (trip.posts && trip.posts.length > 0) {
      const totalCost = trip.posts.reduce((sum, post) => sum + (Number(post.cost) || 0), 0);
      const totalRating = trip.posts.reduce((sum, post) => sum + (Number(post.rating) || 0), 0);
      averageCost = totalCost / trip.posts.length;
      averageRating = totalRating / trip.posts.length;
      postCount = trip.posts.length;
    }

    return {
      tripId: trip.id,
      title: trip.title,
      postsCount: postCount,
      locationsCount: trip.locations?.length || 0,
      durationDays,
      averageCost,
      averageRating,
    };
  }

  async updateTripStatus(tripId: string, userId: string, status: string): Promise<Trip> {
    const validStatuses = ['planning', 'ongoing', 'completed'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const trip = await this.tripRepository.findOne({ where: { id: tripId } });
    if (!trip) {
      throw new NotFoundException(`Trip with ID ${tripId} not found`);
    }

    // Check ownership
    if (trip.user.id !== userId) {
      throw new ForbiddenException('You can only update your own trips');
    }

    trip.status = status;
    return this.tripRepository.save(trip);
  }

  async addLocationToTrip(tripId: string, userId: string, location: string): Promise<Trip> {
    const trip = await this.tripRepository.findOne({ where: { id: tripId } });
    if (!trip) {
      throw new NotFoundException(`Trip with ID ${tripId} not found`);
    }

    // Check ownership
    if (trip.user.id !== userId) {
      throw new ForbiddenException('You can only modify your own trips');
    }

    if (!trip.locations) {
      trip.locations = [];
    }

    if (!trip.locations.includes(location)) {
      trip.locations.push(location);
    }

    return this.tripRepository.save(trip);
  }

  async removeLocationFromTrip(tripId: string, userId: string, location: string): Promise<Trip> {
    const trip = await this.tripRepository.findOne({ where: { id: tripId } });
    if (!trip) {
      throw new NotFoundException(`Trip with ID ${tripId} not found`);
    }

    // Check ownership
    if (trip.user.id !== userId) {
      throw new ForbiddenException('You can only modify your own trips');
    }

    if (trip.locations) {
      trip.locations = trip.locations.filter(loc => loc !== location);
    }

    return this.tripRepository.save(trip);
  }

  async addPlaceToTrip(tripId: string, userId: string, placeId: string): Promise<Trip> {
    const trip = await this.tripRepository.findOne({
      where: { id: tripId },
      relations: ['places'],
    });
    if (!trip) {
      throw new NotFoundException(`Trip with ID ${tripId} not found`);
    }

    // Check ownership
    if (trip.user.id !== userId) {
      throw new ForbiddenException('You can only modify your own trips');
    }

    const place = await this.placeRepository.findOne({ where: { id: placeId } });
    if (!place) {
      throw new NotFoundException(`Place with ID ${placeId} not found`);
    }

    if (!trip.places) {
      trip.places = [];
    }

    // Check if place is already added
    const placeExists = trip.places.some(p => p.id === placeId);
    if (!placeExists) {
      trip.places.push(place);
      return this.tripRepository.save(trip);
    }

    return trip;
  }

  async removePlaceFromTrip(tripId: string, userId: string, placeId: string): Promise<Trip> {
    const trip = await this.tripRepository.findOne({
      where: { id: tripId },
      relations: ['places'],
    });
    if (!trip) {
      throw new NotFoundException(`Trip with ID ${tripId} not found`);
    }

    // Check ownership
    if (trip.user.id !== userId) {
      throw new ForbiddenException('You can only modify your own trips');
    }

    if (trip.places) {
      trip.places = trip.places.filter(p => p.id !== placeId);
      return this.tripRepository.save(trip);
    }

    return trip;
  }

  async getTripPlaces(tripId: string): Promise<Place[]> {
    const trip = await this.tripRepository.findOne({
      where: { id: tripId },
      relations: ['places'],
    });

    if (!trip) {
      throw new NotFoundException(`Trip with ID ${tripId} not found`);
    }

    return trip.places || [];
  }

  async getPlaceTrips(placeId: string): Promise<Trip[]> {
    const place = await this.placeRepository.findOne({
      where: { id: placeId },
      relations: ['trips'],
    });

    if (!place) {
      throw new NotFoundException(`Place with ID ${placeId} not found`);
    }

    return place.trips || [];
  }

  async getTripPlacesStats(tripId: string): Promise<{ totalPlaces: number; avgRating: number; types: Set<string> }> {
    const trip = await this.tripRepository.findOne({
      where: { id: tripId },
      relations: ['places'],
    });

    if (!trip) {
      throw new NotFoundException(`Trip with ID ${tripId} not found`);
    }

    const places = trip.places || [];
    const totalPlaces = places.length;
    const totalRating = places.reduce((sum, place) => sum + (Number(place.rating) || 0), 0);
    const avgRating = totalPlaces > 0 ? totalRating / totalPlaces : 0;

    const typesSet = new Set<string>();
    places.forEach(place => {
      if (place.types) {
        place.types.forEach(type => typesSet.add(type));
      }
    });

    return {
      totalPlaces,
      avgRating,
      types: typesSet,
    };
  }

  // ==================== Collaboration Methods ====================

  async inviteCollaborator(input: InviteCollaboratorInput, userId: string): Promise<TripCollaborator> {
    const { tripId, collaboratorEmail, role } = input;

    // Verify trip ownership
    const trip = await this.tripRepository.findOne({
      where: { id: tripId },
      relations: ['user'],
    });
    if (!trip) {
      throw new NotFoundException(`Trip with ID ${tripId} not found`);
    }

    if (trip.user.id !== userId) {
      throw new ForbiddenException('You can only invite collaborators to your own trips');
    }

    // Find collaborator by email
    const collaborator = await this.userRepository.findOne({
      where: { email: collaboratorEmail },
    });
    if (!collaborator) {
      throw new NotFoundException(`User with email ${collaboratorEmail} not found`);
    }

    // Check if already a collaborator
    const existing = await this.collaboratorRepository.findOne({
      where: { trip: { id: tripId }, user: { id: collaborator.id } },
    });
    if (existing) {
      throw new BadRequestException('This user is already a collaborator on this trip');
    }

    const tripCollaborator = this.collaboratorRepository.create({
      trip,
      user: collaborator,
      role: role || CollaboratorRole.VIEWER,
      invitedBy: userId,
      isAccepted: false,
    });

    return this.collaboratorRepository.save(tripCollaborator);
  }

  async acceptInvitation(collaboratorId: string, userId: string): Promise<TripCollaborator> {
    const collaborator = await this.collaboratorRepository.findOne({
      where: { id: collaboratorId },
      relations: ['user', 'trip'],
    });
    if (!collaborator) {
      throw new NotFoundException(`Collaborator invitation not found`);
    }

    // Verify the user is the one invited
    if (collaborator.user.id !== userId) {
      throw new ForbiddenException('You can only accept your own invitations');
    }

    collaborator.isAccepted = true;
    collaborator.acceptedAt = new Date();

    return this.collaboratorRepository.save(collaborator);
  }

  async rejectInvitation(collaboratorId: string, userId: string): Promise<boolean> {
    const collaborator = await this.collaboratorRepository.findOne({
      where: { id: collaboratorId },
      relations: ['user'],
    });
    if (!collaborator) {
      throw new NotFoundException(`Collaborator invitation not found`);
    }

    // Verify the user is the one invited
    if (collaborator.user.id !== userId) {
      throw new ForbiddenException('You can only reject your own invitations');
    }

    await this.collaboratorRepository.remove(collaborator);
    return true;
  }

  async removeCollaborator(collaboratorId: string, userId: string): Promise<boolean> {
    const collaborator = await this.collaboratorRepository.findOne({
      where: { id: collaboratorId },
      relations: ['trip', 'user'],
    });
    if (!collaborator) {
      throw new NotFoundException(`Collaborator not found`);
    }

    // Either trip owner or the collaborator themselves can remove
    if (collaborator.trip.user.id !== userId && collaborator.user.id !== userId) {
      throw new ForbiddenException('You cannot remove this collaborator');
    }

    await this.collaboratorRepository.remove(collaborator);
    return true;
  }

  async updateCollaboratorRole(input: UpdateCollaboratorRoleInput, userId: string): Promise<TripCollaborator> {
    const collaborator = await this.collaboratorRepository.findOne({
      where: { id: input.collaboratorId },
      relations: ['trip'],
    });
    if (!collaborator) {
      throw new NotFoundException(`Collaborator not found`);
    }

    // Only trip owner can change roles
    if (collaborator.trip.user.id !== userId) {
      throw new ForbiddenException('Only the trip owner can change collaborator roles');
    }

    collaborator.role = input.role;
    return this.collaboratorRepository.save(collaborator);
  }

  async getTripCollaborators(tripId: string): Promise<TripCollaborator[]> {
    const trip = await this.tripRepository.findOne({ where: { id: tripId } });
    if (!trip) {
      throw new NotFoundException(`Trip with ID ${tripId} not found`);
    }

    return this.collaboratorRepository.find({
      where: { trip: { id: tripId }, isAccepted: true },
      relations: ['user', 'trip'],
    });
  }

  async getTripPendingInvitations(tripId: string, userId: string): Promise<TripCollaborator[]> {
    const trip = await this.tripRepository.findOne({
      where: { id: tripId },
      relations: ['user'],
    });
    if (!trip) {
      throw new NotFoundException(`Trip with ID ${tripId} not found`);
    }

    // Only owner can view pending invitations
    if (trip.user.id !== userId) {
      throw new ForbiddenException('Only the trip owner can view pending invitations');
    }

    return this.collaboratorRepository.find({
      where: { trip: { id: tripId }, isAccepted: false },
      relations: ['user', 'trip'],
    });
  }

  async getUserInvitations(userId: string): Promise<TripCollaborator[]> {
    return this.collaboratorRepository.find({
      where: { user: { id: userId }, isAccepted: false },
      relations: ['trip', 'trip.user', 'user'],
      order: { invitedAt: 'DESC' },
    });
  }

  async getSharedTripsForUser(userId: string): Promise<Trip[]> {
    // Get trips where user is an accepted collaborator
    const collaborations = await this.collaboratorRepository.find({
      where: { user: { id: userId }, isAccepted: true },
      relations: ['trip'],
    });

    return collaborations.map(c => c.trip);
  }

  async canUserAccessTrip(tripId: string, userId: string): Promise<boolean> {
    // Check if user is the owner
    const ownedTrip = await this.tripRepository.findOne({
      where: { id: tripId, user: { id: userId } },
    });
    if (ownedTrip) return true;

    // Check if user is an accepted collaborator
    const collaboration = await this.collaboratorRepository.findOne({
      where: { trip: { id: tripId }, user: { id: userId }, isAccepted: true },
    });
    return !!collaboration;
  }

  async canUserEditTrip(tripId: string, userId: string): Promise<boolean> {
    // Check if user is the owner
    const ownedTrip = await this.tripRepository.findOne({
      where: { id: tripId, user: { id: userId } },
    });
    if (ownedTrip) return true;

    // Check if user is an accepted editor or owner collaborator
    const collaboration = await this.collaboratorRepository.findOne({
      where: {
        trip: { id: tripId },
        user: { id: userId },
        isAccepted: true,
      },
    });
    return collaboration ? collaboration.role === CollaboratorRole.EDITOR || collaboration.role === CollaboratorRole.OWNER : false;
  }

  async getUserCollaborationRole(tripId: string, userId: string): Promise<CollaboratorRole | null> {
    // Check if user is the owner
    const ownedTrip = await this.tripRepository.findOne({
      where: { id: tripId, user: { id: userId } },
    });
    if (ownedTrip) return CollaboratorRole.OWNER;

    // Check if user is a collaborator
    const collaboration = await this.collaboratorRepository.findOne({
      where: {
        trip: { id: tripId },
        user: { id: userId },
        isAccepted: true,
      },
    });
    return collaboration ? collaboration.role : null;
  }
}
