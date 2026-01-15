import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Media } from './media.entity';
import { Post } from 'src/post/post.entity';
import { MediaInput } from './dto/media.input';
import * as crypto from 'crypto';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    @InjectRepository(Media)
    private mediaRepository: Repository<Media>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
  ) {}

  /**
   * Create a new media file
   */
  async createMedia(postId: string, input: MediaInput): Promise<Media> {
    this.logger.log(`Creating media for post ${postId}`);

    // Validate post exists
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    // Validate URL
    if (!input.url || input.url.trim().length === 0) {
      throw new BadRequestException('Media URL is required');
    }

    // Determine media type if not provided
    const type = input.type || this.detectMediaType(input.url);

    // Generate checksum from URL
    const checksum = this.generateChecksum(input.url);

    // Create media entity
    const media = this.mediaRepository.create({
      post,
      url: input.url,
      type,
      checksum,
      size: input.url.length, // Approximate size based on URL length
    });

    const saved = await this.mediaRepository.save(media);
    this.logger.log(`Media created with ID: ${saved.id}`);

    return saved;
  }

  /**
   * Get media by ID
   */
  async getMediaById(id: string): Promise<Media | null> {
    this.logger.debug(`Fetching media with ID: ${id}`);

    return this.mediaRepository.findOne({
      where: { id },
      relations: ['post'],
    });
  }

  /**
   * Get all media files for a post
   */
  async getMediaByPostId(postId: string): Promise<Media[]> {
    this.logger.debug(`Fetching media for post: ${postId}`);

    return this.mediaRepository.find({
      where: { post: { id: postId } },
      relations: ['post'],
      order: { id: 'ASC' },
    });
  }

  /**
   * Update media file
   */
  async updateMedia(id: string, input: Partial<MediaInput>): Promise<Media> {
    this.logger.log(`Updating media with ID: ${id}`);

    const media = await this.getMediaById(id);
    if (!media) {
      throw new NotFoundException(`Media with ID ${id} not found`);
    }

    // Update URL if provided
    if (input.url && input.url.trim().length > 0) {
      media.url = input.url;
      media.checksum = this.generateChecksum(input.url);
      media.size = input.url.length;
    }

    // Update type if provided
    if (input.type) {
      media.type = input.type;
    }

    const updated = await this.mediaRepository.save(media);
    this.logger.log(`Media ${id} updated successfully`);

    return updated;
  }

  /**
   * Delete media file
   */
  async deleteMedia(id: string): Promise<boolean> {
    this.logger.log(`Deleting media with ID: ${id}`);

    const media = await this.getMediaById(id);
    if (!media) {
      throw new NotFoundException(`Media with ID ${id} not found`);
    }

    await this.mediaRepository.remove(media);
    this.logger.log(`Media ${id} deleted successfully`);

    return true;
  }

  /**
   * Delete all media files for a post
   */
  async deleteMediaByPostId(postId: string): Promise<number> {
    this.logger.log(`Deleting all media for post: ${postId}`);

    const result = await this.mediaRepository.delete({
      post: { id: postId },
    });

    this.logger.log(`Deleted ${result.affected} media files for post ${postId}`);

    return result.affected || 0;
  }

  /**
   * Check if media already exists by checksum
   */
  async findByChecksum(checksum: string): Promise<Media | null> {
    this.logger.debug(`Finding media by checksum: ${checksum}`);

    return this.mediaRepository.findOne({
      where: { checksum },
      relations: ['post'],
    });
  }

  /**
   * Get media count for a post
   */
  async getMediaCount(postId: string): Promise<number> {
    this.logger.debug(`Getting media count for post: ${postId}`);

    return this.mediaRepository.count({
      where: { post: { id: postId } },
    });
  }

  /**
   * Detect media type from URL
   */
  private detectMediaType(url: string): string {
    const urlLower = url.toLowerCase();

    // Image types
    if (
      urlLower.includes('.jpg') ||
      urlLower.includes('.jpeg') ||
      urlLower.includes('.png') ||
      urlLower.includes('.gif') ||
      urlLower.includes('.webp') ||
      urlLower.includes('.svg') ||
      urlLower.includes('image')
    ) {
      return 'image';
    }

    // Video types
    if (
      urlLower.includes('.mp4') ||
      urlLower.includes('.webm') ||
      urlLower.includes('.mov') ||
      urlLower.includes('.avi') ||
      urlLower.includes('video')
    ) {
      return 'video';
    }

    // Audio types
    if (
      urlLower.includes('.mp3') ||
      urlLower.includes('.wav') ||
      urlLower.includes('.ogg') ||
      urlLower.includes('.aac') ||
      urlLower.includes('audio')
    ) {
      return 'audio';
    }

    // Default to document
    return 'document';
  }

  /**
   * Generate checksum from URL
   */
  private generateChecksum(url: string): string {
    return crypto.createHash('sha256').update(url).digest('hex');
  }

  /**
   * Validate media URL
   */
  private validateMediaUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
