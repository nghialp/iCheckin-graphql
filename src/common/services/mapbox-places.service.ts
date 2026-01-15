import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';

// Constants
const MAPBOX_GEOCODING_API_BASE = 'https://api.mapbox.com/search/geocode/v6/';
// const MAPBOX_SEARCH_API_BASE = 'https://api.mapbox.com/search/v1';
const MAPBOX_SEARCH_API_BASE = 'https://api.mapbox.com/search/searchbox/v1';
const CACHE_TTL_PLACES = 24 * 60 * 60; // 24 hours in seconds
const CACHE_TTL_SEARCH = 6 * 3600; // 6 hours for search results

// Interfaces for Mapbox API responses
interface MapboxFeature {
  type: string; // "Feature"

  geometry: {
    type: string; // "Point"
    coordinates: [number, number]; // [longitude, latitude]
  };

  properties: {
    name: string;
    name_preferred?: string;
    mapbox_id: string;
    feature_type: string; // ví dụ "poi"
    address?: string;
    full_address?: string;
    place_formatted?: string;

    context?: {
      country?: {
        name: string;
        country_code: string;
        country_code_alpha_3: string;
      };
      postcode?: {
        id: string;
        name: string;
      };
      place?: {
        id: string;
        name: string;
      };
      neighborhood?: {
        id: string;
        name: string;
      };
      street?: {
        name: string;
      };
    };

    coordinates?: {
      latitude: number;
      longitude: number;
      routable_points?: {
        name: string;
        latitude: number;
        longitude: number;
      }[];
    };

    language?: string;
    maki?: string; // icon type
    poi_category?: string[];
    poi_category_ids?: string[];
    external_ids?: {
      dataplor?: string;
      [key: string]: string | undefined;
    };
    metadata?: any[];
    distance?: number;
  };
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

    try {
      this.logger.log(`Fetching place details from Mapbox API: ${mapboxId}`);
      const url = `https://api.mapbox.com/search/searchbox/v1/retrieve/${encodeURIComponent(
        mapboxId,
      )}`;
      const response = await axios.get<MapboxSearchResponse>(url, {
        params: {
          access_token: this.MAPBOX_ACCESS_TOKEN,
        }
      });

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
    const { proximity, limit, types } = options || {};
    const params: Record<string, string> = {
      q: query,
      access_token: this.MAPBOX_ACCESS_TOKEN,
    };

    if (proximity) {
      params.proximity = `${proximity[0]},${proximity[1]}`;
    }
    if (limit) {
      params.limit = String(limit);
    }
    if (types && types.length) {
      params.types = types.join(',');
    }

    try {
      const url = `${MAPBOX_SEARCH_API_BASE}/forward`;
      const response = await axios.get<MapboxSearchResponse>(url, { params });

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

    // Build URL with proper parameters
    // radius is in meters, Mapbox Search API expects it
    const url = `${MAPBOX_SEARCH_API_BASE}/forward`;
    const query = keyword ? encodeURIComponent(keyword) : 'all';
    const params = {
      q: query,                 // e.g. "coffee" or "restaurant"
      access_token: this.MAPBOX_ACCESS_TOKEN,
      proximity: `${lng},${lat}`, // bias around user location
      limit: 10,                    // number of items to return
      // optional: country: 'US', language: 'en'
    };

    try {
      this.logger.debug(`Searching nearby places at ${lat},${lng} with radius ${radius}m`);
      this.logger.debug(`Searching nearby places url: ${url}, params: ${JSON.stringify(params)}`);
      const response = await axios.get<MapboxSearchResponse>(url, { params });

      if (response.data.features) {
        const results = response.data.features;

        // Cache results for 6 hours via CACHE_MANAGER
        await this.cacheManager.set(cacheKey, JSON.stringify(results), CACHE_TTL_SEARCH);

        this.logger.debug(`Found ${results.length} nearby places`);
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
    if (!address || address.trim().length === 0) {
      this.logger.warn('Empty address provided to geocodeAddress');
      return null;
    }

    const cacheKey = `place:geocode:${address}`;

    // Check cache
    const cached = await this.cacheManager.get<string>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache HIT for geocode: ${address}`);
      const data = JSON.parse(cached);
      return { lat: data.lat, lng: data.lng };
    }

    const encodedAddress = encodeURIComponent(address.trim());
    const url = `${MAPBOX_GEOCODING_API_BASE}/forward`;
    // const url = `${MAPBOX_GEOCODING_API_BASE}/${encodedAddress}.json?access_token=${this.MAPBOX_ACCESS_TOKEN}&limit=1`;

    try {
      const params = {
        q: address,              // search text
        limit: 1,                // only the best match
        access_token: this.MAPBOX_ACCESS_TOKEN,
      };

      this.logger.debug(`Geocoding address: ${address}`);
      const { data } = await axios.get<MapboxGeocodingResponse>(url, { params });
      const feature = data?.features?.[0];
      if (!feature || !feature.geometry || !feature.geometry.coordinates) {
        this.logger.warn(`No geocoding results found for: ${address}`);
        return null;
      }
      const [lng, lat] = feature.geometry.coordinates;
      const result = { lat, lng };

      // Cache for 24 hours
      await this.cacheManager.set(cacheKey, JSON.stringify(result), CACHE_TTL_PLACES);

      this.logger.debug(`Geocoded "${address}" to lat=${lat}, lng=${lng}`);
      return result;
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(`Geocoding API error for "${address}": ${axiosError.message}`);
      throw new Error('Không thể chuyển đổi địa chỉ thành tọa độ');
    }
  }

  /**
   * Reverse geocoding: convert coordinates to address
   */
  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
      this.logger.warn(`Invalid coordinates provided: lat=${lat}, lng=${lng}`);
      return null;
    }

    const cacheKey = `place:reversegeocode:${lat},${lng}`;

    // Check cache
    const cached = await this.cacheManager.get<string>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache HIT for reverse geocode: ${lat},${lng}`);
      return cached;
    }

    // const url = `${MAPBOX_GEOCODING_API_BASE}/${lng},${lat}.json?access_token=${this.MAPBOX_ACCESS_TOKEN}&types=address&limit=1`;
    const url = `${MAPBOX_GEOCODING_API_BASE}/reverse`;

    const params = {
      latitude: lat,
      longitude: lng,
      limit: 1,               // best match only (optional)
      access_token: this.MAPBOX_ACCESS_TOKEN,
    };

    const { data } = await axios.get(url, { params });

    try {
      this.logger.debug(`Reverse geocoding coordinates: lat=${lat}, lng=${lng}`);
      const { data } = await axios.get<MapboxGeocodingResponse>(url);
      const feature = data?.features?.[0];

      if (feature) {
        const address = this.buildAddressFromFeature(feature);
        if (address) {
          // Cache for 24 hours
          await this.cacheManager.set(cacheKey, address, CACHE_TTL_PLACES);
          this.logger.debug(`Reverse geocoded lat=${lat}, lng=${lng} to "${address}"`);
          return address;
        }
      }
      this.logger.warn(`No address found for coordinates: lat=${lat}, lng=${lng}`);

      return null;
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(`Reverse geocoding API error for lat=${lat}, lng=${lng}: ${axiosError.message}`);
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
    const props = feature.properties;

    // Extract mapbox ID
    const mapboxId = props.mapbox_id || feature.type;

    // Extract name (prefer name_preferred)
    const name = props.name_preferred || props.name || 'Unknown Place';

    // Build address from available properties
    let address: string | undefined;
    if (props.address) {
      address = props.address;
    } else if (props.full_address) {
      address = props.full_address;
    } else if (props.place_formatted) {
      address = props.place_formatted;
    }

    // Extract context information if available
    if (props.context && !address) {
      const addressParts: string[] = [];

      // Add street if available
      if (props.context.street?.name) {
        addressParts.push(props.context.street.name);
      }

      // Add neighborhood if available
      if (props.context.neighborhood?.name) {
        addressParts.push(props.context.neighborhood.name);
      }

      // Add place (city) if available
      if (props.context.place?.name) {
        addressParts.push(props.context.place.name);
      }

      // Add country if available
      if (props.context.country?.name) {
        addressParts.push(props.context.country.name);
      }

      if (addressParts.length > 0) {
        address = addressParts.join(', ');
      }
    }

    // Extract types/categories
    const types: string[] = [];
    if (props.poi_category && Array.isArray(props.poi_category)) {
      types.push(...props.poi_category);
    } else if (props.feature_type) {
      types.push(props.feature_type);
    }

    return {
      mapboxId,
      name,
      address,
      lat,
      lng,
      types: types.length > 0 ? types : undefined,
      thumbnail: this.getThumbnailUrl(lat, lng, name),
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

