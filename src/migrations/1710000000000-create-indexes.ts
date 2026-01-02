import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class CreateIndexes1710000000000 implements MigrationInterface {
    name = 'CreateIndexes1710000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // USER table indexes
        await queryRunner.createIndex('user', new TableIndex({
            name: 'idx_user_email',
            columnNames: ['email']
        }));
        await queryRunner.createIndex('user', new TableIndex({
            name: 'idx_user_name',
            columnNames: ['name']
        }));

        // PLACE table indexes
        await queryRunner.createIndex('place', new TableIndex({
            name: 'idx_place_google_place_id',
            columnNames: ['google_place_id']
        }));
        await queryRunner.createIndex('place', new TableIndex({
            name: 'idx_place_name',
            columnNames: ['name']
        }));

        // POST table indexes
        await queryRunner.createIndex('post', new TableIndex({
            name: 'idx_post_user_id',
            columnNames: ['user_id']
        }));
        await queryRunner.createIndex('post', new TableIndex({
            name: 'idx_post_place_id',
            columnNames: ['place_id']
        }));
        await queryRunner.createIndex('post', new TableIndex({
            name: 'idx_post_created_at',
            columnNames: ['created_at']
        }));

        // CHECKIN table indexes
        await queryRunner.createIndex('checkin', new TableIndex({
            name: 'idx_checkin_user_id',
            columnNames: ['user_id']
        }));
        await queryRunner.createIndex('checkin', new TableIndex({
            name: 'idx_checkin_place_id',
            columnNames: ['place_id']
        }));
        await queryRunner.createIndex('checkin', new TableIndex({
            name: 'idx_checkin_checked_at',
            columnNames: ['checked_at']
        }));

        // COMMENT table indexes
        await queryRunner.createIndex('comment', new TableIndex({
            name: 'idx_comment_post_id',
            columnNames: ['post_id']
        }));
        await queryRunner.createIndex('comment', new TableIndex({
            name: 'idx_comment_user_id',
            columnNames: ['user_id']
        }));
        await queryRunner.createIndex('comment', new TableIndex({
            name: 'idx_comment_created_at',
            columnNames: ['created_at']
        }));

        // FRIENDSHIP table indexes
        await queryRunner.createIndex('friendship', new TableIndex({
            name: 'idx_friendship_requester_id',
            columnNames: ['requester_id']
        }));
        await queryRunner.createIndex('friendship', new TableIndex({
            name: 'idx_friendship_recipient_id',
            columnNames: ['recipient_id']
        }));
        await queryRunner.createIndex('friendship', new TableIndex({
            name: 'idx_friendship_status',
            columnNames: ['status']
        }));

        // MEDIA table indexes
        await queryRunner.createIndex('media', new TableIndex({
            name: 'idx_media_post_id',
            columnNames: ['post_id']
        }));

        // TRIP table indexes
        await queryRunner.createIndex('trip', new TableIndex({
            name: 'idx_trip_user_id',
            columnNames: ['user_id']
        }));
        await queryRunner.createIndex('trip', new TableIndex({
            name: 'idx_trip_start_date',
            columnNames: ['start_date']
        }));
        await queryRunner.createIndex('trip', new TableIndex({
            name: 'idx_trip_end_date',
            columnNames: ['end_date']
        }));

        // REWARD table indexes
        await queryRunner.createIndex('reward', new TableIndex({
            name: 'idx_reward_type',
            columnNames: ['type']
        }));

        // POINT_LEDGER table indexes
        await queryRunner.createIndex('point_ledger', new TableIndex({
            name: 'idx_point_ledger_user_id',
            columnNames: ['user_id']
        }));
        await queryRunner.createIndex('point_ledger', new TableIndex({
            name: 'idx_point_ledger_timestamp',
            columnNames: ['timestamp']
        }));

        // USEFUL_VOTE table indexes
        await queryRunner.createIndex('useful_vote', new TableIndex({
            name: 'idx_useful_vote_post_id',
            columnNames: ['post_id']
        }));
        await queryRunner.createIndex('useful_vote', new TableIndex({
            name: 'idx_useful_vote_user_id',
            columnNames: ['user_id']
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes in reverse order
        await queryRunner.dropIndex('useful_vote', 'idx_useful_vote_user_id');
        await queryRunner.dropIndex('useful_vote', 'idx_useful_vote_post_id');
        await queryRunner.dropIndex('point_ledger', 'idx_point_ledger_timestamp');
        await queryRunner.dropIndex('point_ledger', 'idx_point_ledger_user_id');
        await queryRunner.dropIndex('reward', 'idx_reward_type');
        await queryRunner.dropIndex('trip', 'idx_trip_end_date');
        await queryRunner.dropIndex('trip', 'idx_trip_start_date');
        await queryRunner.dropIndex('trip', 'idx_trip_user_id');
        await queryRunner.dropIndex('media', 'idx_media_post_id');
        await queryRunner.dropIndex('friendship', 'idx_friendship_status');
        await queryRunner.dropIndex('friendship', 'idx_friendship_recipient_id');
        await queryRunner.dropIndex('friendship', 'idx_friendship_requester_id');
        await queryRunner.dropIndex('comment', 'idx_comment_created_at');
        await queryRunner.dropIndex('comment', 'idx_comment_user_id');
        await queryRunner.dropIndex('comment', 'idx_comment_post_id');
        await queryRunner.dropIndex('checkin', 'idx_checkin_checked_at');
        await queryRunner.dropIndex('checkin', 'idx_checkin_place_id');
        await queryRunner.dropIndex('checkin', 'idx_checkin_user_id');
        await queryRunner.dropIndex('post', 'idx_post_created_at');
        await queryRunner.dropIndex('post', 'idx_post_place_id');
        await queryRunner.dropIndex('post', 'idx_post_user_id');
        await queryRunner.dropIndex('place', 'idx_place_name');
        await queryRunner.dropIndex('place', 'idx_place_google_place_id');
        await queryRunner.dropIndex('user', 'idx_user_name');
        await queryRunner.dropIndex('user', 'idx_user_email');
    }
}

