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

## Step 4: Tối ưu Google Places API với CACHE_MANAGER (Redis)
- [x] Tạo `src/common/middleware/rate-limit.middleware.ts` - Rate limiting theo IP
- [x] Tạo `src/common/services/google-places-cache.service.ts` - Cache service dùng CACHE_MANAGER
- [x] Tạo `src/common/common.module.ts` - Common module
- [x] Refactor `place.service.ts`:
  - Chỉ sử dụng CACHE_MANAGER (không dùng Redis trực tiếp)
  - Caching cho `findOrCreateFromGooglePlaceId` (24h)
  - Caching cho `getNearbyPlaces` (1h)
  - Caching cho `searchPlacesByKeyword` (2h)
  - Caching cho `getPhotoStream` (1h)
- [x] Cập nhật `app.module.ts` - Import CommonModule

## Step 5: Environment Variables (optional)
```env
# Rate Limiting (optional)
RATE_LIMIT_WINDOW_MS=60000      # 1 phút
RATE_LIMIT_MAX_REQUESTS=100     # 100 requests per window
RATE_LIMIT_BLOCK_DURATION=300   # 5 phút block khi vượt quota
```

## Step 6: Chạy migration
```bash
# Build project
npm run build

# Chạy migration
npm run migration:run
```

## Cấu trúc Cache (CACHE_MANAGER = Redis)

### Place Details Cache
- **Key**: `place:details:{googlePlaceId}`
- **TTL**: 24 giờ
- **Mục đích**: Cache thông tin chi tiết địa điểm từ Google API

### Nearby Places Cache
- **Key**: `place:nearby:{lat},{lng}:{radius}`
- **TTL**: 1 giờ
- **Mục đích**: Cache kết quả tìm kiếm địa điểm lân cận

### Search Cache
- **Key**: `place:search:{keyword}:{lat}:{lng}:{radius}`
- **TTL**: 2 giờ
- **Mục đích**: Cache kết quả tìm kiếm theo từ khóa

### Photo Cache
- **Key**: `{photoReference}`
- **TTL**: 1 giờ
- **Mục đích**: Cache ảnh địa điểm (base64)

### Text Search Cache
- **Key**: `place:textsearch:{query}`
- **TTL**: 6 giờ
- **Mục đích**: Cache kết quả text search

## Rate Limiting
- **Window**: 1 phút (có thể cấu hình)
- **Max Requests**: 100 request/window (có thể cấu hình)
- **Block Duration**: 5 phút khi vượt quota
- **Key**: `ratelimit:{ip}:{path}`

## Lợi ích
1. **Giảm chi phí Google Maps API**: Cache Redis lưu kết quả API
2. **Tăng tốc độ phản hồi**: Request sau đầu tiên trả về từ cache
3. **Bảo vệ khỏi abuse**: Rate limiting theo IP
4. **Sử dụng CACHE_MANAGER**:统一 cache management, dễ maintain

