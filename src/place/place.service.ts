import { Inject, Injectable, Logger, StreamableFile } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import axios, { AxiosError } from "axios";
import { Repository } from "typeorm";
import { Place } from "./place.entity";
import { CreatePlaceInput, SearchPlace } from "./dto/place.input";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import type { Cache } from 'cache-manager';

// Constants for API configuration
const GOOGLE_PLACES_API_BASE = 'https://maps.googleapis.com/maps/api/place';
const CACHE_TTL_PHOTO = 3600; // 1 hour for photos
const CACHE_TTL_PLACE_DETAILS = 24 * 60 * 60; // 24 hours for place details
const CACHE_TTL_NEARBY = 3600; // 1 hour for nearby search
const CACHE_TTL_SEARCH = 7200; // 2 hours for text search

// Interfaces for Google Places API responses
interface GooglePlacePhoto {
	photo_reference: string;
	height: number;
	width: number;
}

interface GooglePlaceGeometry {
	location: {
		lat: number;
		lng: number;
	};
}

interface GooglePlaceResult {
	place_id: string;
	name: string;
	formatted_address?: string;
	vicinity?: string;
	rating?: number;
	types: string[];
	photos?: GooglePlacePhoto[];
	geometry: GooglePlaceGeometry;
}

interface GooglePlacesApiResponse {
	status: string;
	results: GooglePlaceResult[];
	error_message?: string;
}

interface GeocodingResult {
	formatted_address: string;
}

interface GeocodingApiResponse {
	status: string;
	results: GeocodingResult[];
}

@Injectable()
export class PlaceService {
	private readonly logger = new Logger(PlaceService.name);
	private readonly GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
	private readonly API_BASE = process.env.API_BASE_URL;

	constructor(
		@InjectRepository(Place)
		private placeRepo: Repository<Place>,
		@Inject(CACHE_MANAGER) private cacheManager: Cache,
	) { }

	// get photo from REST API
	getThumbnailUrl(photoReference?: string): string | undefined {
		if (!photoReference) return undefined;
		return `${this.API_BASE}/places/photo/${photoReference}`;
	}

	// load image from google map
	async getPhotoStream(reference: string): Promise<StreamableFile> {
		this.logger.log(`Fetching photo with reference: ${reference.substring(0, 10)}...`);

		// Check cache first using CACHE_MANAGER
		const cached = await this.cacheManager.get<string>(reference);
		if (cached) {
			this.logger.debug(`Cache hit for photo reference: ${reference.substring(0, 10)}...`);
			return new StreamableFile(Buffer.from(cached, 'base64'), {
				type: 'image/jpeg',
			});
		}

		// If not cached → call Google API
		const url = `${GOOGLE_PLACES_API_BASE}/photo?maxwidth=400&photoreference=${reference}&key=${this.GOOGLE_MAPS_API_KEY}`;

		try {
			const response = await axios.get(url, { responseType: 'arraybuffer' });
			const base64Data = Buffer.from(response.data).toString('base64');

			// Save to Redis via CACHE_MANAGER
			await this.cacheManager.set(reference, base64Data, CACHE_TTL_PHOTO);
			this.logger.debug(`Photo cached successfully`);

			return new StreamableFile(response.data, {
				type: response.headers['content-type'] || 'image/jpeg',
			});
		} catch (error) {
			const axiosError = error as AxiosError;
			this.logger.error(`Failed to fetch photo from Google API: ${axiosError.message}`);
			throw new Error('Không thể tải ảnh từ Google Maps');
		}
	}

	async createPlace(placeInput: CreatePlaceInput): Promise<Place> {
		this.logger.log(`Creating place: ${placeInput.name}`);
		const place = this.placeRepo.create(placeInput);
		return this.placeRepo.save(place);
	}

	async findOneBy(options: Omit<Partial<Place>, 'coordinates' | 'types' | 'thumbnail'>): Promise<Place | null> {
		return this.placeRepo.findOneBy(options);
	}

	/**
	 * Find place by googlePlaceId, if not found call Google API and create new
	 * Using CACHE_MANAGER (Redis) to reduce API calls
	 */
	async findOrCreateFromGooglePlaceId(googlePlaceId: string): Promise<Place> {
		this.logger.log(`Finding or creating place from Google Place ID: ${googlePlaceId}`);
		const cacheKey = `place:details:${googlePlaceId}`;

		// 1. Check cache first
		const cached = await this.cacheManager.get<string>(cacheKey);
		if (cached) {
			this.logger.debug(`Cache hit for place: ${googlePlaceId}`);
			const cachedData = JSON.parse(cached);
			const existingPlace = await this.placeRepo.findOne({
				where: { googlePlaceId },
			});
			if (existingPlace) {
				return existingPlace;
			}
		}

		// 2. Find in database
		const existingPlace = await this.placeRepo.findOne({
			where: { googlePlaceId },
		});

		if (existingPlace) {
			this.logger.log(`Found existing place: ${existingPlace.id}`);
			// Cache in Redis via CACHE_MANAGER
			await this.cacheManager.set(cacheKey, JSON.stringify({
				place_id: existingPlace.googlePlaceId,
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

		// 3. If not found → call Google Places Details API
		this.logger.log(`Fetching from Google API: ${googlePlaceId}`);
		const url = `${GOOGLE_PLACES_API_BASE}/details/json?place_id=${googlePlaceId}&fields=place_id,name,formatted_address,rating,types,geometry,photos&key=${this.GOOGLE_MAPS_API_KEY}`;

		try {
			const response = await axios.get(url);

			if (response.data.status !== 'OK' || !response.data.result) {
				throw new Error(`Google Places API error: ${response.data.status}`);
			}

			const placeData = response.data.result;

			// 4. Create new place from Google data
			const newPlace = this.placeRepo.create({
				googlePlaceId: placeData.place_id,
				name: placeData.name,
				address: placeData.formatted_address,
				rating: placeData.rating,
				types: placeData.types,
				lat: placeData.geometry.location.lat,
				lng: placeData.geometry.location.lng,
				thumbnail: this.getThumbnailUrl(placeData.photos[0].photo_reference),
			});

			const savedPlace = await this.placeRepo.save(newPlace);
			this.logger.log(`Created new place: ${savedPlace.id}`);

			// 5. Cache via CACHE_MANAGER
			await this.cacheManager.set(cacheKey, JSON.stringify(placeData), CACHE_TTL_PLACE_DETAILS);

			return savedPlace;
		} catch (error) {
			const axiosError = error as AxiosError;
			this.logger.error(`Failed to fetch place details: ${axiosError.message}`);
			throw new Error('Không thể lấy thông tin địa điểm từ Google Maps');
		}
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
			throw new Error('Tọa độ không hợp lệ');
		}

		const url = `${GOOGLE_PLACES_API_BASE}/geocode/json?latlng=${lat},${lng}&key=${this.GOOGLE_MAPS_API_KEY}`;

		try {
			const response = await axios.get<GeocodingApiResponse>(url);

			if (response.data.status === 'OK' && response.data.results.length > 0) {
				return response.data.results[0].formatted_address;
			}

			this.logger.warn(`Geocoding API returned status: ${response.data.status}`);
			return null;
		} catch (error) {
			const axiosError = error as AxiosError;
			this.logger.error(`Geocoding API error: ${axiosError.message}`);
			throw new Error('Không thể lấy địa chỉ từ tọa độ');
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
			throw new Error('Bán kính tìm kiếm phải từ 1 đến 50000 mét');
		}

		const cacheKey = `place:nearby:${lat},${lng}:${radius}`;

		// Check cache first
		const cached = await this.cacheManager.get<string>(cacheKey);
		if (cached) {
			this.logger.debug(`Cache hit for nearby places`);
			return JSON.parse(cached);
		}

		const url = `${GOOGLE_PLACES_API_BASE}/nearbysearch/json?location=${lat},${lng}&radius=${radius}&key=${this.GOOGLE_MAPS_API_KEY}`;

		try {
			const response = await axios.get<GooglePlacesApiResponse>(url);

			if (response.data.status === 'OK') {
				const results = response.data.results.map((place: GooglePlaceResult) => ({
					googlePlaceId: place.place_id,
					name: place.name,
					address: place.formatted_address || place.vicinity || '',
					rating: place.rating,
					types: place.types,
					lat: place.geometry.location.lat,
					lng: place.geometry.location.lng,
					thumbnail: this.getThumbnailUrl(place.photos?.[0]?.photo_reference),
				}));

				// Cache for 1 hour (nearby search changes more frequently)
				await this.cacheManager.set(cacheKey, JSON.stringify(results), CACHE_TTL_NEARBY);

				return results;
			}

			if (response.data.error_message) {
				this.logger.error(`Google Places API error: ${response.data.error_message}`);
			}

			return [];
		} catch (error) {
			const axiosError = error as AxiosError;
			this.logger.error(`Nearby places API error: ${axiosError.message}`);
			throw new Error('Không thể tìm kiếm địa điểm lân cận');
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
			throw new Error('Từ khóa tìm kiếm không được để trống');
		}

		// Create cache key
		const cacheKey = `place:search:${keyword}:${lat}:${lng}:${radius}`;

		// Check cache first
		const cached = await this.cacheManager.get<string>(cacheKey);
		if (cached) {
			this.logger.debug(`Cache hit for search: ${keyword}`);
			return JSON.parse(cached);
		}

		let url: string;

		// If coordinates provided, search nearby first
		if (lat !== undefined && lng !== undefined) {
			if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
				throw new Error('Tọa độ không hợp lệ');
			}
			url = `${GOOGLE_PLACES_API_BASE}/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=${encodeURIComponent(
				keyword,
			)}&key=${this.GOOGLE_MAPS_API_KEY}`;
		} else {
			url = `${GOOGLE_PLACES_API_BASE}/textsearch/json?query=${encodeURIComponent(
				keyword,
			)}&key=${this.GOOGLE_MAPS_API_KEY}`;
		}

		try {
			const response = await axios.get<GooglePlacesApiResponse>(url);

			if (response.data.status === 'OK') {
				const results = response.data.results.map((place: GooglePlaceResult) => ({
					googlePlaceId: place.place_id,
					name: place.name,
					address: place.formatted_address || place.vicinity || '',
					rating: place.rating,
					types: place.types,
					lat: place.geometry.location.lat,
					lng: place.geometry.location.lng,
					thumbnail: this.getThumbnailUrl(place.photos?.[0]?.photo_reference),
				}));

				// Cache for 2 hours (text search results are more stable)
				await this.cacheManager.set(cacheKey, JSON.stringify(results), CACHE_TTL_SEARCH);

				return results;
			}

			if (response.data.error_message) {
				this.logger.error(`Google Places API error: ${response.data.error_message}`);
			}

			return [];
		} catch (error) {
			const axiosError = error as AxiosError;
			this.logger.error(`Search places API error: ${axiosError.message}`);
			throw new Error('Không thể tìm kiếm địa điểm');
		}
	}
}

