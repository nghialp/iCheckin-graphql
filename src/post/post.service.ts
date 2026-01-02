import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Post } from "./post.entity";
import { CreatePostInput } from "./dto/post.input";
import { User } from "src/user/entities/user.entity";

@Injectable()
export class PostService {
    constructor(
        @InjectRepository(Post)
        private postRepo: Repository<Post>,
    ) {}
    async createPost(createPostInput: CreatePostInput, user: User): Promise<Post> {
        const place = await this.postRepo.findOneBy({ id: createPostInput.placeId });
        if (!place) {
            throw new Error('Place not found');
        }
        const post = this.postRepo.create({
            user,
            place,
            content: createPostInput.content,
            media: createPostInput.media,
            tags: createPostInput.tags,
            cost: createPostInput.cost,
            rating: createPostInput.rating,
            createdAt: new Date(),
            comments: [],
        });
        return this.postRepo.save(post);
    }

    async findOneBy(options: Omit<Partial<Post>, 'tags' | 'comments' | 'media'>): Promise<Post | null> {
        return this.postRepo.findOneBy(options);
    }
}