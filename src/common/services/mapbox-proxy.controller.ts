import { Controller, Get, Query, Res, Param } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Controller('mapbox')
export class MapboxProxyController {
  private readonly MAPBOX_ACCESS_TOKEN: string;
  private readonly API_BASE_URL: string;

  constructor(
    private configService: ConfigService,
  ) {
    this.MAPBOX_ACCESS_TOKEN = this.configService.get('MAPBOX_ACCESS_TOKEN', '');
    this.API_BASE_URL = this.configService.get('API_BASE_URL', 'http://localhost:3000');
  }

  /**
   * Proxy endpoint for Mapbox static images
   * Hides the API key from the client
   */
  @Get('static')
  async getStaticImage(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('name') name: string | undefined,
    @Query('width') width: string | undefined,
    @Query('height') height: string | undefined,
    @Query('zoom') zoom: string | undefined,
    @Res() res: FastifyReply,
  ): Promise<void> {
    try {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      const widthNum = parseInt(width || '400', 10);
      const heightNum = parseInt(height || '300', 10);
      const zoomNum = parseInt(zoom || '16', 10);

      if (isNaN(latNum) || isNaN(lngNum)) {
        res.status(400).send({ error: 'Invalid coordinates' });
        return;
      }

      // Build the Mapbox Static Images API URL
      const encodedName = name ? encodeURIComponent(name) : 'place';
      const mapboxUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+${encodedName}(${lngNum},${latNum})/${lngNum},${latNum},${zoomNum}/${widthNum}x${heightNum}@2x?access_token=${this.MAPBOX_ACCESS_TOKEN}`;

      // Fetch image from Mapbox
      const response = await axios.get(mapboxUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
      });

      // Set cache headers (cache for 24 hours)
      res.header('Cache-Control', 'public, max-age=86400');
      res.header('Content-Type', response.headers['content-type'] || 'image/png');

      res.send(Buffer.from(response.data));
    } catch (error) {
      console.error('Error fetching Mapbox image:', error);
      res.status(500).send({ error: 'Failed to fetch image' });
    }
  }

  /**
   * Proxy endpoint for Mapbox tile images
   * Useful for displaying map tiles without exposing the API key
   */
  @Get('tile/:z/:x/:y')
  async getTile(
    @Param('z') z: string,
    @Param('x') x: string,
    @Param('y') y: string,
    @Res() res: FastifyReply,
  ): Promise<void> {
    try {
      const mapboxUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/${z}/${x}/${y}?access_token=${this.MAPBOX_ACCESS_TOKEN}`;

      const response = await axios.get(mapboxUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
      });

      res.header('Cache-Control', 'public, max-age=86400');
      res.header('Content-Type', response.headers['content-type'] || 'image/png');

      res.send(Buffer.from(response.data));
    } catch (error) {
      console.error('Error fetching Mapbox tile:', error);
      res.status(500).send({ error: 'Failed to fetch tile' });
    }
  }

  /**
   * Get thumbnail URL using the proxy endpoint
   */
  getThumbnailUrl(lat: number, lng: number, name?: string): string {
    const encodedName = name ? encodeURIComponent(name) : 'place';
    return `${this.API_BASE_URL}/mapbox/static?lat=${lat}&lng=${lng}&name=${encodedName}`;
  }
}

