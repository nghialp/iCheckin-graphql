# TODO - Create Indexes Migration

## Step 1: Tạo thư mục migrations và migration file
- [x] Tạo thư mục `src/migrations`
- [x] Tạo file migration `1710000000000-create-indexes.ts`

## Step 2: Tạo migration với các indexes cho tất cả entities
- [x] User: idx_user_email, idx_user_name
- [x] Place: idx_place_google_place_id, idx_place_name
- [x] Post: idx_post_user_id, idx_post_place_id, idx_post_created_at
- [x] Checkin: idx_checkin_user_id, idx_checkin_place_id, idx_checkin_checked_at
- [x] Comment: idx_comment_post_id, idx_comment_user_id, idx_comment_created_at
- [x] Friendship: idx_friendship_requester_id, idx_friendship_recipient_id, idx_friendship_status
- [x] Media: idx_media_post_id
- [x] Trip: idx_trip_user_id, idx_trip_start_date, idx_trip_end_date
- [x] Reward: idx_reward_type
- [x] PointLedger: idx_point_ledger_user_id, idx_point_ledger_timestamp
- [x] UsefulVote: idx_useful_vote_post_id, idx_useful_vote_user_id

## Step 3: Xóa index decorators khỏi entity files
- [x] Xóa @Index từ user.entity.ts
- [x] Xóa @Index từ place.entity.ts

## Step 4: Cấu hình TypeORM CLI
- [x] Tạo ormconfig.json
- [x] Thêm scripts vào package.json

## Step 5: Chạy migration
```bash
# Build project
npm run build

# Chạy migration
npm run migration:run
```

