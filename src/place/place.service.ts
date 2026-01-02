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
const CACHE_TTL = 3600; // 1 hour

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
		@Inject(CACHE_MANAGER) private cacheManager: Cache
	) { }

	// get photo from REST API
	getThumbnailUrl(photoReference?: string): string | null {
		if (!photoReference) return null;
		return `${this.API_BASE}/places/photo/${photoReference}`;
	}

	// load image from google map
	async getPhotoStream(reference: string): Promise<StreamableFile> {
		this.logger.log(`Fetching photo with reference: ${reference.substring(0, 10)}...`);

		// Kiểm tra cache trước
		const cached = await this.cacheManager.get<string>(reference);
		if (cached) {
			this.logger.debug(`Cache hit for photo reference: ${reference.substring(0, 10)}...`);
			return new StreamableFile(Buffer.from(cached, 'base64'), {
				type: 'image/jpeg',
			});
		}

		// Nếu chưa có cache → gọi Google API
		const url = `${GOOGLE_PLACES_API_BASE}/photo?maxwidth=400&photoreference=${reference}&key=${this.GOOGLE_MAPS_API_KEY}`;

		try {
			const response = await axios.get(url, { responseType: 'arraybuffer' });
			const base64Data = Buffer.from(response.data).toString('base64');

			// Lưu vào Redis (TTL 1h)
			await this.cacheManager.set(reference, base64Data, CACHE_TTL);
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

	async findOneBy(options: Omit<Partial<Place>, 'coordinates' | 'types'>): Promise<Place | null> {
		return this.placeRepo.findOneBy(options);
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
	 * Reverse geocoding: lấy địa chỉ từ tọa độ
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
	 * Places Nearby: lấy danh sách địa điểm gần tọa độ
	 */
	async getNearbyPlaces(lat: number, lng: number, radius: number = 500): Promise<SearchPlace[]> {
		this.logger.log(`Getting nearby places at (${lat}, ${lng}) with radius: ${radius}m`);

		// Validate input
		if (radius <= 0 || radius > 50000) {
			throw new Error('Bán kính tìm kiếm phải từ 1 đến 50000 mét');
		}

		const url = `${GOOGLE_PLACES_API_BASE}/nearbysearch/json?location=${lat},${lng}&radius=${radius}&key=${this.GOOGLE_MAPS_API_KEY}`;

		try {
			const response = await axios.get<GooglePlacesApiResponse>(url);

			if (response.data.status === 'OK') {
				return response.data.results.map((place: GooglePlaceResult) => ({
					googlePlaceId: place.place_id,
					name: place.name,
					address: place.formatted_address || place.vicinity || '',
					rating: place.rating,
					types: place.types,
					lat: place.geometry.location.lat,
					lng: place.geometry.location.lng,
					thumbnail: this.getThumbnailUrl(place.photos?.[0]?.photo_reference),
				}));
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

	// ✅ Search địa điểm theo keyword
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

		let url: string;

		// Nếu có tọa độ thì ưu tiên tìm quanh vị trí đó
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
				return response.data.results.map((place: GooglePlaceResult) => ({
					googlePlaceId: place.place_id,
					name: place.name,
					address: place.formatted_address || place.vicinity || '',
					rating: place.rating,
					types: place.types,
					lat: place.geometry.location.lat,
					lng: place.geometry.location.lng,
					thumbnail: this.getThumbnailUrl(place.photos?.[0]?.photo_reference),
				}));
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
