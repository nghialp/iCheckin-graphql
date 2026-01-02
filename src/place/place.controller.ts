import { Controller, Get, Param } from '@nestjs/common';
import { PlaceService } from './place.service';
import { StreamableFile } from '@nestjs/common';

@Controller('places')
export class PlaceController {
  constructor(private readonly placeService: PlaceService) {}

  @Get('photo/:reference')
  async getPhoto(@Param('reference') reference: string): Promise<StreamableFile> {
    return this.placeService.getPhotoStream(reference);
  }
}