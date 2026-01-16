import { Inject, Injectable, Logger, StreamableFile, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import axios, { AxiosError } from "axios";
import { Repository } from "typeorm";
import { Place } from "./place.entity";
import { CreatePlaceInput, SearchPlace } from "./dto/place.input";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import type { Cache } from 'cache-manager';
import { MapboxPlacesService } from "src/common/services/mapbox-places.service";

// Constants for API configuration
const CACHE_TTL_PLACE_DETAILS = 24 * 60 * 60; // 24 hours for place details
const CACHE_TTL_NEARBY = 3600; // 1 hour for nearby search
const CACHE_TTL_SEARCH = 7200; // 2 hours for text search

@Injectable()
export class PlaceService {
	private readonly logger = new Logger(PlaceService.name);
	private readonly MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
	private readonly API_BASE = process.env.API_BASE_URL;

	constructor(
		@InjectRepository(Place)
		private placeRepo: Repository<Place>,
		@Inject(CACHE_MANAGER) private cacheManager: Cache,
		private mapboxService: MapboxPlacesService,
	) { }

	// get thumbnail URL from coordinates
	getThumbnailUrl(lat: number, lng: number, name?: string): string | undefined {
		return this.mapboxService.getThumbnailUrl(lat, lng, name);
	}

	/**
	 * Find place by mapboxId, if not found call Mapbox API and create new
	 * Using CACHE_MANAGER (Redis) to reduce API calls
	 */
	async findOrCreateFromMapboxId(mapboxId: string): Promise<Place> {
		this.logger.log(`Finding or creating place from Mapbox ID: ${mapboxId}`);
		const cacheKey = `place:details:${mapboxId}`;

		// 1. Check cache first
		const cached = await this.cacheManager.get<string>(cacheKey);
		if (cached) {
			this.logger.debug(`Cache hit for place: ${mapboxId}`);
			const cachedData = JSON.parse(cached);
			return cachedData;
		}

		// 2. Find in database
		const existingPlace = await this.placeRepo.findOne({
			where: { mapboxId },
		});

		if (existingPlace) {
			this.logger.log(`Found existing place: ${existingPlace.id}`);
			// Cache in Redis via CACHE_MANAGER
			await this.cacheManager.set(cacheKey, JSON.stringify({
				mapboxId: existingPlace.mapboxId,
				name: existingPlace.name,
				address: existingPlace.address,
				rating: existingPlace.rating,
				types: existingPlace.types,
				lat: existingPlace.lat,
				lng: existingPlace.lng,
				thumbnail: existingPlace.thumbnail,
			}), CACHE_TTL_PLACE_DETAILS);
			return existingPlace;
		}

		// 3. If not found → call Mapbox Places API
		this.logger.log(`Fetching from Mapbox API: ${mapboxId}`);

		try {
			const placeData = await this.mapboxService.getPlaceDetails(mapboxId);

			if (!placeData) {
				throw new NotFoundException(`Place not found in Mapbox: ${mapboxId}`);
			}

			const transformedData = this.mapboxService.transformToPlace(placeData);

			// 4. Create new place from Mapbox data
			const newPlace = this.placeRepo.create({
				mapboxId: transformedData.mapboxId,
				name: transformedData.name,
				address: transformedData.address,
				rating: transformedData.rating,
				types: transformedData.types,
				lat: transformedData.lat,
				lng: transformedData.lng,
				thumbnail: transformedData.thumbnail,
			});

			const savedPlace = await this.placeRepo.save(newPlace);
			this.logger.log(`Created new place: ${savedPlace.id}`);

			// 5. Cache via CACHE_MANAGER
			await this.cacheManager.set(cacheKey, JSON.stringify(placeData), CACHE_TTL_PLACE_DETAILS);

			return savedPlace;
		} catch (error) {
			const axiosError = error as AxiosError;
			this.logger.error(`Failed to fetch place details: ${axiosError?.message || String(error)}`);
			throw new BadRequestException('Unable to fetch place details from Mapbox');
		}
	}

	async createPlace(placeInput: CreatePlaceInput): Promise<Place> {
		this.logger.log(`Creating place: ${placeInput.name}`);
		const place = this.placeRepo.create(placeInput);
		return this.placeRepo.save(place);
	}

	async findOneBy(options: Omit<Partial<Place>, 'coordinates' | 'types' | 'thumbnail' | 'trips' | 'checkins'>): Promise<Place | null> {
		return this.placeRepo.findOneBy(options as any);
	}

	async findNearestPlaces(keyword: string, lat: number, lng: number): Promise<Place[]> {
		this.logger.log(`Searching nearest places with keyword: ${keyword} at (${lat}, ${lng})`);

		return this.placeRepo
			.createQueryBuilder('place')
			.where('place.name ILIKE :keyword', { keyword: `%${keyword}%` })
			.addSelect(`
        6371 * acos(
          cos(radians(:lat)) * cos(radians((place.coordinates->>'lat')::float)) *
          cos(radians((place.coordinates->>'lng')::float) - radians(:lng)) +
          sin(radians(:lat)) * sin(radians((place.coordinates->>'lat')::float))
        )
      `, 'distance')
			.setParameters({ lat, lng })
			.orderBy('distance', 'ASC')
			.limit(10)
			.getMany();
	}

	async getNearestPlaces(lat: number, lng: number): Promise<Place[]> {
		this.logger.log(`Getting nearest places at (${lat}, ${lng})`);

		return this.placeRepo
			.createQueryBuilder('place')
			.addSelect(`
        6371 * acos(
          cos(radians(:lat)) * cos(radians((place.coordinates->>'lat')::float)) *
          cos(radians((place.coordinates->>'lng')::float) - radians(:lng)) +
          sin(radians(:lat)) * sin(radians((place.coordinates->>'lat')::float))
        )
      `, 'distance')
			.setParameters({ lat, lng })
			.orderBy('distance', 'ASC')
			.limit(10)
			.getMany();
	}

	/**
	 * Reverse geocoding: get address from coordinates
	 */
	async getAddressFromCoordinates(lat: number, lng: number): Promise<string | null> {
		this.logger.log(`Reverse geocoding for coordinates: (${lat}, ${lng})`);

		// Validate coordinates
		if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
			this.logger.warn(`Invalid coordinates: (${lat}, ${lng})`);
			throw new BadRequestException('Invalid coordinates');
		}

		try {
			const address = await this.mapboxService.reverseGeocode(lat, lng);
			return address;
		} catch (error) {
			const axiosError = error as AxiosError;
			this.logger.error(`Reverse geocoding error: ${axiosError?.message || String(error)}`);
			throw new BadRequestException('Unable to get address from coordinates');
		}
	}

	/**
	 * Places Nearby: get list of places near coordinates
	 * Using CACHE_MANAGER to reduce API calls
	 */
	async getNearbyPlaces(lat: number, lng: number, radius: number = 500): Promise<SearchPlace[]> {
		this.logger.log(`Getting nearby places at (${lat}, ${lng}) with radius: ${radius}m`);

		// Validate input
		if (radius <= 0 || radius > 50000) {
			throw new BadRequestException('Search radius must be between 1 and 50000 meters');
		}

		const cacheKey = `place:nearby:${lat},${lng}:${radius}`;

		// Check cache first
		const cached = await this.cacheManager.get<string>(cacheKey);
		if (cached) {
			this.logger.debug(`Cache hit for nearby places`);
			return JSON.parse(cached);
		}

		try {
			const features = await this.mapboxService.searchNearby(lng, lat, radius);

			const results = features.map((feature) =>
				this.mapboxService.transformToSearchPlace(feature)
			);

			// Cache for 1 hour (nearby search changes more frequently)
			await this.cacheManager.set(cacheKey, JSON.stringify(results), CACHE_TTL_NEARBY);

			return results;
		} catch (error) {
			const axiosError = error as AxiosError;
			this.logger.error(`Nearby places API error: ${axiosError?.message || String(error)}`);
			throw new BadRequestException('Unable to search nearby places');
		}
	}

	/**
	 * Search places by keyword with caching
	 */
	async searchPlacesByKeyword(
		keyword: string,
		lat?: number,
		lng?: number,
		radius: number = 1000,
	): Promise<SearchPlace[]> {
		this.logger.log(`Searching places with keyword: "${keyword}" at (${lat}, ${lng})`);

		if (!keyword || keyword.trim().length === 0) {
			throw new BadRequestException('Search keyword cannot be empty');
		}

		// Create cache key
		const cacheKey = `place:search:${keyword}:${lat}:${lng}:${radius}`;

		// Check cache first
		const cached = await this.cacheManager.get<string>(cacheKey);
		if (cached) {
			this.logger.debug(`Cache hit for search: ${keyword}`);
			return JSON.parse(cached);
		}

		try {
			// If coordinates provided, search with proximity
			let features;
			if (lat !== undefined && lng !== undefined) {
				if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
					throw new BadRequestException('Invalid coordinates');
				}
				features = await this.mapboxService.searchByText(keyword, {
					proximity: [lng, lat],
					limit: 10,
				});
			} else {
				features = await this.mapboxService.searchByText(keyword, {
					limit: 10,
				});
			}

			const results = features.map((feature) =>
				this.mapboxService.transformToSearchPlace(feature)
			);

			// Cache for 2 hours (text search results are more stable)
			await this.cacheManager.set(cacheKey, JSON.stringify(results), CACHE_TTL_SEARCH);

			return results;
		} catch (error) {
			const axiosError = error as AxiosError;
			this.logger.error(`Search places API error: ${axiosError?.message || String(error)}`);
			throw new BadRequestException('Unable to search places');
		}
	}
}

