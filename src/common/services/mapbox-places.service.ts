import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';

// Constants
const MAPBOX_GEOCODING_API_BASE = 'https://api.mapbox.com/geocoding/v5/mapbox.places';
const MAPBOX_SEARCH_API_BASE = 'https://api.mapbox.com/search/v1';
const CACHE_TTL_PLACES = 24 * 60 * 60; // 24 hours in seconds
const CACHE_TTL_SEARCH = 6 * 3600; // 6 hours for search results

// Interfaces for Mapbox API responses
interface MapboxFeature {
  id: string;
  place_id: string;
  name: string;
  address?: string;
  full_address?: string;
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  properties?: {
    category?: string;
    wikidata?: string;
    maki?: string;
  };
  context?: Array<{
    id: string;
    text: string;
    short_code?: string;
  }>;
  relevance?: number;
}

interface MapboxSearchResponse {
  type: 'FeatureCollection';
  features: MapboxFeature[];
  attribution: string;
}

interface MapboxGeocodingResponse {
  type: 'FeatureCollection';
  features: MapboxGeocodingFeature[];
  attribution: string;
}

interface MapboxGeocodingFeature {
  id: string;
  place_id: string;
  name: string;
  address?: string;
  context?: Array<{
    id: string;
    text: string;
    short_code?: string;
  }>;
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  properties: Record<string, unknown>;
}

@Injectable()
export class MapboxPlacesService {
  private readonly logger = new Logger(MapboxPlacesService.name);
  private readonly MAPBOX_ACCESS_TOKEN: string;
  private readonly API_BASE_URL: string;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {
    this.MAPBOX_ACCESS_TOKEN = this.configService.get('MAPBOX_ACCESS_TOKEN', '');
    this.API_BASE_URL = this.configService.get('API_BASE_URL', 'http://localhost:3000');
  }

  /**
   * Get thumbnail URL for a place using Mapbox Static Images API via proxy
   * Hides the API key from the client
   */
  getThumbnailUrl(lat: number, lng: number, name?: string): string {
    const encodedName = name ? encodeURIComponent(name) : 'place';
    return `${this.API_BASE_URL}/mapbox/static?lat=${lat}&lng=${lng}&name=${encodedName}`;
  }

  /**
   * Get place details by Mapbox ID or coordinates
   */
  async getPlaceDetails(mapboxId: string): Promise<MapboxFeature | null> {
    const cacheKey = `place:details:${mapboxId}`;
    
    // 1. Check cache first using CACHE_MANAGER
    const cached = await this.cacheManager.get<string>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache HIT for place details: ${mapboxId}`);
      return JSON.parse(cached);
    }

    // 2. Fetch from Mapbox Search API
    this.logger.log(`Fetching place details from Mapbox API: ${mapboxId}`);
    const url = `${MAPBOX_SEARCH_API_BASE}/place/${encodeURIComponent(mapboxId)}?access_token=${this.MAPBOX_ACCESS_TOKEN}`;

    try {
      const response = await axios.get<MapboxSearchResponse>(url);
      
      if (response.data.features && response.data.features.length > 0) {
        const placeData = response.data.features[0];

        // 3. Cache via CACHE_MANAGER
        await this.cacheManager.set(cacheKey, JSON.stringify(placeData), CACHE_TTL_PLACES);

        return placeData;
      }

      this.logger.warn(`No place found with ID: ${mapboxId}`);
      return null;
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(`Failed to fetch place details: ${axiosError.message}`);
      throw new Error('Không thể lấy thông tin địa điểm từ Mapbox');
    }
  }

  /**
   * Search places by text query with caching
   */
  async searchByText(query: string, options?: {
    proximity?: [number, number]; // [lng, lat]
    radius?: number; // meters
    limit?: number;
    types?: string[];
  }): Promise<MapboxFeature[]> {
    const cacheKey = `place:textsearch:${query}:${JSON.stringify(options)}`;
    
    // Check cache using CACHE_MANAGER
    const cached = await this.cacheManager.get<string>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache HIT for text search: ${query}`);
      return JSON.parse(cached);
    }

    // Build URL
    let url = `${MAPBOX_SEARCH_API_BASE}/search?access_token=${this.MAPBOX_ACCESS_TOKEN}&q=${encodeURIComponent(query)}`;
    
    if (options?.proximity) {
      url += `&proximity=${options.proximity[0]},${options.proximity[1]}`;
    }
    if (options?.radius) {
      url += `&radius=${options.radius}`;
    }
    if (options?.limit) {
      url += `&limit=${options.limit}`;
    }
    if (options?.types && options.types.length > 0) {
      url += `&types=${options.types.join(',')}`;
    }

    try {
      const response = await axios.get<MapboxSearchResponse>(url);

      if (response.data.features) {
        const results = response.data.features;

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
   * Search nearby places with caching
   */
  async searchNearby(
    lng: number,
    lat: number,
    radius: number = 500,
    keyword?: string,
  ): Promise<MapboxFeature[]> {
    const cacheKey = `place:search:${lat},${lng}:${radius}:${keyword || 'all'}`;
    
    // Check cache using CACHE_MANAGER
    const cached = await this.cacheManager.get<string>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache HIT for nearby search`);
      return JSON.parse(cached);
    }

    // Build URL
    let url = `${MAPBOX_SEARCH_API_BASE}/search?access_token=${this.MAPBOX_ACCESS_TOKEN}&proximity=${lng},${lat}&limit=10`;
    
    if (keyword) {
      url += `&q=${encodeURIComponent(keyword)}`;
    }

    try {
      const response = await axios.get<MapboxSearchResponse>(url);

      if (response.data.features) {
        const results = response.data.features;

        // Cache results for 1 hour via CACHE_MANAGER
        await this.cacheManager.set(cacheKey, JSON.stringify(results), CACHE_TTL_SEARCH);

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
   * Forward geocoding: convert address to coordinates
   */
  async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    const cacheKey = `place:geocode:${address}`;
    
    // Check cache
    const cached = await this.cacheManager.get<string>(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      return { lat: data.lat, lng: data.lng };
    }

    const url = `${MAPBOX_GEOCODING_API_BASE}/${encodeURIComponent(address)}.json?access_token=${this.MAPBOX_ACCESS_TOKEN}&limit=1`;

    try {
      const response = await axios.get<MapboxGeocodingResponse>(url);

      if (response.data.features && response.data.features.length > 0) {
        const feature = response.data.features[0];
        const [lng, lat] = feature.geometry.coordinates;
        const result = { lat, lng };

        // Cache for 24 hours
        await this.cacheManager.set(cacheKey, JSON.stringify(result), CACHE_TTL_PLACES);

        return result;
      }

      return null;
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(`Geocoding API error: ${axiosError.message}`);
      throw new Error('Không thể chuyển đổi địa chỉ thành tọa độ');
    }
  }

  /**
   * Reverse geocoding: convert coordinates to address
   */
  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    const cacheKey = `place:reversegeocode:${lat},${lng}`;
    
    // Check cache
    const cached = await this.cacheManager.get<string>(cacheKey);
    if (cached) {
      return cached;
    }

    const url = `${MAPBOX_GEOCODING_API_BASE}/${lng},${lat}.json?access_token=${this.MAPBOX_ACCESS_TOKEN}&types=address&limit=1`;

    try {
      const response = await axios.get<MapboxGeocodingResponse>(url);

      if (response.data.features && response.data.features.length > 0) {
        const feature = response.data.features[0];
        // Build address from feature properties
        const address = this.buildAddressFromFeature(feature);
        
        // Cache for 24 hours
        await this.cacheManager.set(cacheKey, address, CACHE_TTL_PLACES);

        return address;
      }

      return null;
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(`Reverse geocoding API error: ${axiosError.message}`);
      throw new Error('Không thể lấy địa chỉ từ tọa độ');
    }
  }

  /**
   * Build a human-readable address from a Mapbox geocoding feature
   */
  private buildAddressFromFeature(feature: MapboxGeocodingFeature): string {
    const parts: string[] = [];

    if (feature.address) {
      parts.push(feature.address);
    }

    if (feature.context) {
      for (const ctx of feature.context) {
        if (ctx.short_code && ctx.short_code.startsWith('place')) {
          parts.push(ctx.text);
          break;
        }
      }
      for (const ctx of feature.context) {
        if (ctx.short_code && ctx.short_code.startsWith('region')) {
          parts.push(ctx.text);
          break;
        }
      }
      for (const ctx of feature.context) {
        if (ctx.short_code && ctx.short_code.startsWith('country')) {
          parts.push(ctx.text);
          break;
        }
      }
    }

    return parts.join(', ');
  }

  /**
   * Pre-warm cache with popular places
   */
  async prewarmCache(mapboxIds: string[]): Promise<void> {
    this.logger.log(`Prewarming cache for ${mapboxIds.length} places`);
    
    for (const placeId of mapboxIds) {
      try {
        await this.getPlaceDetails(placeId);
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        this.logger.warn(`Failed to prewarm cache for ${placeId}: ${(error as Error).message}`);
      }
    }
  }

  /**
   * Transform Mapbox feature to SearchPlace format
   */
  transformToSearchPlace(feature: MapboxFeature): {
    mapboxId: string;
    name: string;
    address?: string;
    rating?: number;
    types?: string[];
    lat: number;
    lng: number;
    thumbnail?: string;
  } {
    const [lng, lat] = feature.geometry.coordinates;
    
    // Build address from feature
    let address: string | undefined;
    if (feature.address) {
      address = feature.address;
      if (feature.context) {
        for (const ctx of feature.context) {
          if (ctx.short_code && ctx.short_code.startsWith('place')) {
            address += `, ${ctx.text}`;
            break;
          }
        }
      }
    }

    return {
      mapboxId: feature.id,
      name: feature.name,
      address,
      lat,
      lng,
      types: feature.properties?.category ? [feature.properties.category] : undefined,
      thumbnail: this.getThumbnailUrl(lat, lng, feature.name),
    };
  }

  /**
   * Transform Mapbox feature to Place entity format
   */
  transformToPlace(feature: MapboxFeature): {
    mapboxId: string;
    name: string;
    address?: string;
    rating?: number;
    types?: string[];
    lat: number;
    lng: number;
    thumbnail?: string;
  } {
    return this.transformToSearchPlace(feature);
  }
}

