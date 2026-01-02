import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';

// Constants
const GOOGLE_PLACES_API_BASE = 'https://maps.googleapis.com/maps/api/place';
const CACHE_TTL_PLACES = 24 * 60 * 60; // 24 hours in seconds
const CACHE_TTL_PHOTOS = 7 * 24 * 60 * 60; // 7 days for photos
const CACHE_TTL_NEARBY = 3600; // 1 hour
const CACHE_TTL_SEARCH = 6 * 3600; // 6 hours

// Interfaces
interface GooglePlaceDetailsResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  rating?: number;
  types?: string[];
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
}

interface GooglePlaceSearchResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  vicinity?: string;
  rating?: number;
  types: string[];
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  photos?: Array<{
    photo_reference: string;
  }>;
}

@Injectable()
export class GooglePlacesCacheService {
  private readonly logger = new Logger(GooglePlacesCacheService.name);
  private readonly GOOGLE_MAPS_API_KEY: string;
  private readonly API_BASE_URL: string;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {
    this.GOOGLE_MAPS_API_KEY = this.configService.get('GOOGLE_MAPS_API_KEY', '');
    this.API_BASE_URL = this.configService.get('API_BASE_URL', 'http://localhost:3000');
  }

  /**
   * Get thumbnail URL from photo reference with caching
   */
  getThumbnailUrl(photoReference?: string): string | null {
    if (!photoReference) return null;
    return `${this.API_BASE_URL}/places/photo/${photoReference}`;
  }

  /**
   * Get cached place details or fetch from Google API
   */
  async getPlaceDetails(googlePlaceId: string): Promise<GooglePlaceDetailsResult | null> {
    const cacheKey = `place:details:${googlePlaceId}`;
    
    // 1. Check cache first using CACHE_MANAGER
    const cached = await this.cacheManager.get<string>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache HIT for place details: ${googlePlaceId}`);
      return JSON.parse(cached);
    }

    // 2. Fetch from Google API
    this.logger.log(`Fetching place details from Google API: ${googlePlaceId}`);
    const url = `${GOOGLE_PLACES_API_BASE}/details/json?place_id=${googlePlaceId}&fields=place_id,name,formatted_address,rating,types,geometry,photos&key=${this.GOOGLE_MAPS_API_KEY}`;

    try {
      const response = await axios.get(url);
      
      if (response.data.status !== 'OK' || !response.data.result) {
        this.logger.warn(`Google API error: ${response.data.status}`);
        return null;
      }

      const placeData = response.data.result;

      // 3. Cache via CACHE_MANAGER
      await this.cacheManager.set(cacheKey, JSON.stringify(placeData), CACHE_TTL_PLACES);

      return placeData;
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(`Failed to fetch place details: ${axiosError.message}`);
      throw new Error('Không thể lấy thông tin địa điểm từ Google Maps');
    }
  }

  /**
   * Search places with caching for nearby search results
   */
  async searchNearby(
    lat: number,
    lng: number,
    radius: number = 500,
    keyword?: string,
  ): Promise<GooglePlaceSearchResult[]> {
    const cacheKey = `place:search:${lat},${lng}:${radius}:${keyword || 'all'}`;
    
    // Check cache using CACHE_MANAGER
    const cached = await this.cacheManager.get<string>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache HIT for nearby search`);
      return JSON.parse(cached);
    }

    // Build URL
    let url = `${GOOGLE_PLACES_API_BASE}/nearbysearch/json?location=${lat},${lng}&radius=${radius}&key=${this.GOOGLE_MAPS_API_KEY}`;
    if (keyword) {
      url += `&keyword=${encodeURIComponent(keyword)}`;
    }

    try {
      const response = await axios.get(url);

      if (response.data.status === 'OK') {
        const results = response.data.results;

        // Cache results for 1 hour via CACHE_MANAGER
        await this.cacheManager.set(cacheKey, JSON.stringify(results), CACHE_TTL_NEARBY);

        return results;
      }

      return [];
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(`Nearby search API error: ${axiosError.message}`);
      throw new Error('Không thể tìm kiếm địa điểm lân cận');
    }
  }

  /**
   * Search places by text query with caching
   */
  async searchByText(query: string): Promise<GooglePlaceSearchResult[]> {
    const cacheKey = `place:textsearch:${query}`;
    
    // Check cache using CACHE_MANAGER
    const cached = await this.cacheManager.get<string>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache HIT for text search: ${query}`);
      return JSON.parse(cached);
    }

    const url = `${GOOGLE_PLACES_API_BASE}/textsearch/json?query=${encodeURIComponent(query)}&key=${this.GOOGLE_MAPS_API_KEY}`;

    try {
      const response = await axios.get(url);

      if (response.data.status === 'OK') {
        const results = response.data.results;

        // Cache results for 6 hours via CACHE_MANAGER
        await this.cacheManager.set(cacheKey, JSON.stringify(results), CACHE_TTL_SEARCH);

        return results;
      }

      return [];
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(`Text search API error: ${axiosError.message}`);
      throw new Error('Không thể tìm kiếm địa điểm');
    }
  }

  /**
   * Get photo with caching (stores base64 via CACHE_MANAGER)
   */
  async getPhoto(photoReference: string): Promise<{ data: Buffer; contentType: string } | null> {
    const cacheKey = `place:photo:${photoReference}`;
    
    // Check cache using CACHE_MANAGER
    const cached = await this.cacheManager.get<string>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache HIT for photo`);
      return {
        data: Buffer.from(cached, 'base64'),
        contentType: 'image/jpeg',
      };
    }

    // Fetch from Google
    const url = `${GOOGLE_PLACES_API_BASE}/photo?maxwidth=800&photoreference=${photoReference}&key=${this.GOOGLE_MAPS_API_KEY}`;

    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const base64Data = Buffer.from(response.data).toString('base64');

      // Cache for 7 days via CACHE_MANAGER
      await this.cacheManager.set(cacheKey, base64Data, CACHE_TTL_PHOTOS);

      return {
        data: response.data as Buffer,
        contentType: response.headers['content-type'] || 'image/jpeg',
      };
    } catch (error) {
      this.logger.error(`Failed to fetch photo: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Pre-warm cache with popular places (for demo/popular locations)
   */
  async prewarmCache(googlePlaceIds: string[]): Promise<void> {
    this.logger.log(`Prewarming cache for ${googlePlaceIds.length} places`);
    
    for (const placeId of googlePlaceIds) {
      try {
        await this.getPlaceDetails(placeId);
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        this.logger.warn(`Failed to prewarm cache for ${placeId}: ${(error as Error).message}`);
      }
    }
  }
}

