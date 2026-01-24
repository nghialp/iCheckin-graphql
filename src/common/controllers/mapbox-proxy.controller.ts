import {
	Controller,
	Get,
	Query,
	BadRequestException,
	Logger,
	StreamableFile,
} from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { ConfigService } from '@nestjs/config';

/**
 * Proxy controller for Mapbox Static Images API
 * Hides the API key from the client by proxying requests
 */
@Controller('mapbox')
export class MapboxProxyController {
	private readonly logger = new Logger(MapboxProxyController.name);
	private readonly MAPBOX_ACCESS_TOKEN: string;

	constructor(private configService: ConfigService) {
		this.MAPBOX_ACCESS_TOKEN = this.configService.get('MAPBOX_ACCESS_TOKEN', '');
	}

	/**
	 * GET /mapbox/static
	 * Proxy endpoint to get static map thumbnail images from Mapbox
	 * 
	 * Query parameters:
	 * - lat: latitude (required)
	 * - lng: longitude (required)
	 * - name: optional place name for overlay text
	 * - width: image width in pixels (default: 300)
	 * - height: image height in pixels (default: 200)
	 * - zoom: zoom level (default: 14)
	 * - style: mapbox style (default: 'mapbox/streets-v12')
	 * 
	 * Example: GET /mapbox/static?lat=21.0285&lng=105.8542&name=Hanoi&width=400&height=300
	 */
	@Get('/static')
	async getStaticImage(
		@Query('lat') lat?: string,
		@Query('lng') lng?: string,
		@Query('name') name?: string,
		@Query('width') width: string = '300',
		@Query('height') height: string = '200',
		@Query('zoom') zoom: string = '14',
		@Query('style') style: string = 'mapbox/streets-v12',
	): Promise<StreamableFile> {
		try {
			// Validate required parameters
			if (!lat || !lng) {
				throw new BadRequestException('Missing required parameters: lat and lng');
			}

			const latNum = parseFloat(lat);
			const lngNum = parseFloat(lng);
			const widthNum = Math.min(Math.max(parseInt(width, 10), 100), 1280); // 100-1280px
			const heightNum = Math.min(Math.max(parseInt(height, 10), 100), 1280);
			const zoomNum = Math.min(Math.max(parseInt(zoom, 10), 0), 20); // 0-20

			// Validate coordinates
			if (isNaN(latNum) || isNaN(lngNum)) {
				throw new BadRequestException('Invalid coordinates: lat and lng must be numbers');
			}

			if (latNum < -90 || latNum > 90) {
				throw new BadRequestException('Invalid latitude: must be between -90 and 90');
			}

			if (lngNum < -180 || lngNum > 180) {
				throw new BadRequestException('Invalid longitude: must be between -180 and 180');
			}

			// Build marker overlay if name is provided
			let markerOverlay = '';
			if (name) {
				// Pin marker with name label
				// Format: pin-s+color(label)/coordinates
				const encodedName = encodeURIComponent(name.substring(0, 15)); // Limit to 15 chars
				markerOverlay = `/pin-s-l+ff0000(${encodedName})/${lngNum},${latNum}`;
			}

			// Build Mapbox Static Images API URL
			const mapboxUrl =
				`https://api.mapbox.com/styles/v1/${style}/static/` +
				`${lng},${lat},${zoomNum}/` +
				`${width}x${height}` +
				`?access_token=${this.MAPBOX_ACCESS_TOKEN}`;

			this.logger.debug(
				`Fetching static map: lat=${latNum}, lng=${lngNum}, zoom=${zoomNum}, size=${widthNum}x${heightNum}`,
			);

			// Fetch image from Mapbox
			const response = await axios.get(mapboxUrl, {
				responseType: 'arraybuffer',
				timeout: 10000,
			});

			this.logger.debug(`Static map retrieved successfully`);
			return new StreamableFile(response.data);
		} catch (error) {
			if (error instanceof BadRequestException) {
				this.logger.warn(`Validation error: ${error.message}`);
				throw error;
			}

			if (axios.isAxiosError(error)) {
				const axiosError = error as AxiosError;
				this.logger.error(
					`Mapbox Static Images API error: ${axiosError.message}`,
					axiosError.stack,
				);

				if (axiosError.response?.status === 401) {
					throw new BadRequestException('Invalid Mapbox access token');
				}

				throw new BadRequestException(
					`Failed to retrieve map image: ${axiosError.message}`,
				);
			}

			const err = error as Error;
			this.logger.error(`Unexpected error: ${err.message}`, err.stack);
			throw new BadRequestException('Failed to retrieve map image');
		}
	}

	/**
	 * GET /mapbox/preview
	 * Alternative endpoint for quick previews with simpler parameters
	 * 
	 * Query parameters:
	 * - lat: latitude (required)
	 * - lng: longitude (required)
	 * 
	 * Returns a fixed-size thumbnail (200x150px)
	 */
	@Get('/preview')
	async getPreview(
		@Query('lat') lat?: string,
		@Query('lng') lng?: string,
	): Promise<StreamableFile> {
		// Delegate to /static with fixed dimensions
		return this.getStaticImage(lat, lng, undefined, '200', '150', '13', 'mapbox/streets-v12');
	}
}
