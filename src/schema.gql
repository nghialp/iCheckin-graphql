# ------------------------------------------------------
# THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
# ------------------------------------------------------

type Media {
  id: ID!
  post: Post!
  type: String!
  url: String!
  size: Float
  checksum: String
}

type Comment {
  id: ID!
  post: Post!
  user: User!
  content: String!
  createdAt: DateTime!
  parent_id: String
}

"""
A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format.
"""
scalar DateTime

type Post {
  id: ID!
  user: User!
  place: Place
  trip: Trip
  content: String!
  tags: [String!]
  cost: Float
  rating: Float
  media: [Media!]
  createdAt: DateTime!
  updatedAt: DateTime!
}

type TripCollaborator {
  id: ID!
  trip: Trip!
  user: User!
  role: String!
  invitedBy: String
  isAccepted: Boolean!
  invitedAt: DateTime!
  acceptedAt: DateTime
  updatedAt: DateTime!
}

type TripItinerary {
  id: ID!
  trip: Trip!
  dayNumber: Float!
  date: DateTime!
  title: String
  description: String
  activities: [ItineraryActivity!]
  createdAt: DateTime!
  updatedAt: DateTime!
}

type ItineraryActivity {
  id: ID!
  itinerary: TripItinerary!
  title: String!
  description: String
  startTime: String!
  endTime: String!
  location: String
  placeId: String
  category: String
  notes: String
  estimatedCost: Float
  isCompleted: Boolean
  priority: Float
  createdAt: DateTime!
  updatedAt: DateTime!
}

type TripLike {
  id: ID!
  user: User!
  trip: Trip!
  createdAt: DateTime!
}

type TripComment {
  id: ID!
  user: User!
  trip: Trip!
  content: String!
  parent_id: String
  createdAt: DateTime!
  updatedAt: DateTime
}

type Trip {
  id: ID!
  user: User!
  title: String!
  description: String
  start_date: DateTime!
  end_date: DateTime!
  locations: [String!]
  places: [Place!]
  status: String
  posts: [Post!]
  collaborators: [TripCollaborator!]
  itineraries: [TripItinerary!]
  likes: [TripLike!]
  comments: [TripComment!]
  checkin_list: [String!]
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Place {
  id: ID!
  name: String!
  address: String
  types: [String!]
  rating: Float
  thumbnail: String
  mapboxId: String
  lat: Float!
  lng: Float!
  trips: [Trip!]
}

type CheckinLike {
  id: ID!
  user: User!
  checkin: Checkin!
  createdAt: DateTime!
}

type CheckinComment {
  id: ID!
  user: User!
  checkin: Checkin!
  content: String!
  parent_id: String
  createdAt: DateTime!
  updatedAt: DateTime
}

type Checkin {
  id: ID!
  user: User!
  place: Place!
  checkedAt: DateTime!
  status: String!
  mood: Mood
  likes: [CheckinLike!]
  comments: [CheckinComment!]
}

"""Mood states for check-ins"""
enum Mood {
  HAPPY
  SAD
  NEUTRAL
  EXCITED
  TIRED
  ENERGETIC
  GRATEFUL
  PEACEFUL
  LOVELY
  AMAZING
}

type Friendship {
  id: ID!
  requester: User!
  recipient: User!
  status: FriendshipStatus!
  createdAt: DateTime!
}

"""Trạng thái quan hệ bạn bè"""
enum FriendshipStatus {
  PENDING
  ACCEPTED
  REJECTED
}

type Like {
  id: ID!
  user: User!
  post: Post!
  createdAt: DateTime!
}

type CheckinFavorite {
  id: ID!
  user: User!
  checkin: Checkin!
  createdAt: DateTime!
}

type PlaceFavorite {
  id: ID!
  user: User!
  place: Place!
  createdAt: DateTime!
}

type UserBasicInfo {
  id: ID!
  name: String
  email: String
  phone: String
  avatar: String
  dateOfBirth: String
  gender: String
  location: String
  bio: String
}

type NotificationSettings {
  pushNotifications: Boolean
  emailNotifications: Boolean
  smsNotifications: Boolean
  promotions: Boolean
  updates: Boolean
  reminders: Boolean
}

type PrivacySettings {
  locationAccess: Boolean
  contactsAccess: Boolean
  cameraAccess: Boolean
  microphoneAccess: Boolean
  profileVisibility: String
  activityStatus: Boolean
}

type LoginHistoryItem {
  timestamp: String
  device: String
  ip: String
  location: String
  status: String
}

type ConnectedDeviceItem {
  id: String
  name: String
  type: String
  lastActive: String
}

type SecuritySettings {
  twoFactorEnabled: Boolean
  loginHistory: [LoginHistoryItem!]
  connectedDevices: [ConnectedDeviceItem!]
}

type UpdateProfileResponse {
  success: Boolean!
  message: String!
  user: UserBasicInfo
}

type SettingsUpdateResponse {
  success: Boolean!
  message: String!
  notificationSettings: NotificationSettings
  privacySettings: PrivacySettings
  securitySettings: SecuritySettings
}

type AvatarUpdateResponse {
  success: Boolean!
  message: String!
  user: UserBasicInfo
}

type User {
  id: ID!
  name: String!
  email: String!
  avatar: String
  points: Float!
  points_balance: Float!
  level: String!
  sentFriendRequests: [Friendship!]!
  checkins: [Checkin!]!
  receivedFriendRequests: [Friendship!]!
  bio: String
  country: String
  interests: [String!]
  privacy_settings: String
  phone: String
  dateOfBirth: String
  gender: String
  location: String
  hobby: String
  notificationSettings: NotificationSettings
  privacySettings: PrivacySettings
  securitySettings: SecuritySettings
  trips: [Trip!]
  tripCollaborations: [TripCollaborator!]
  followers: [User!]
  followings: [User!]
  likes: [Like!]
  favoriteCheckins: [CheckinFavorite!]
  favoritePlaces: [PlaceFavorite!]
  createdAt: DateTime!
  updatedAt: DateTime!
  deletedAt: DateTime
}

type AuthResponse {
  accessToken: String!
  refreshToken: String!
  user: User!
}

type ToggleLikeResponse {
  liked: Boolean!
  likeCount: Int!
}

type CheckinLikeEvent {
  checkinId: ID!
  like: CheckinLike!
  likeCount: Int!
}

type CheckinCommentEvent {
  checkinId: ID!
  comment: CheckinComment!
}

type TripLikeEvent {
  tripId: ID!
  like: TripLike!
  likeCount: Int!
}

type TripCommentEvent {
  tripId: ID!
  comment: TripComment!
}

type PostLikeEvent {
  postId: ID!
  like: Like!
  likeCount: Int!
}

type SearchPlace {
  mapboxId: String
  name: String!
  rating: Float
  address: String
  types: [String!]
  lat: Float!
  lng: Float!
  thumbnail: String
  distance: Float
}

type Voucher {
  id: ID!
  reward: Reward!
  user: User!
  voucher_code: String!
  qr_code: String!
  redeem_date: DateTime!
  expiry_date: DateTime
  status: String!
  used_date: DateTime
  note: String
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Reward {
  id: ID!
  title: String!
  description: String!
  category: String!
  points_required: Float!
  stock: Float!
  expiry_date: DateTime
  partner_id: String
  image_url: String!
  status: String!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type PointLedger {
  transaction_id: ID!
  user: User!
  action_type: String!
  points_change: Float!
  balance_after: Float!
  location: Place
  reward: Reward
  voucher: Voucher
  note: String
  timestamp: DateTime!
}

type PointTransactionResponse {
  transaction_id: String!
  action_type: String!
  points_change: Float!
  balance_after: Float!
  user: User!
  note: String
  timestamp: DateTime!
}

type PointsSummaryResponse {
  userId: String!
  currentPoints: Float!
  currentLevel: String!
  totalTransactions: Float!
  totalVouchers: Float!
  unusedVouchers: Float!
  nextLevelThreshold: Float!
  pointsToNextLevel: Float!
}

type RedeemRewardResponse {
  success: Boolean!
  message: String!
  voucher: Voucher
}

type VoucherDetailsResponse {
  id: String!
  voucher_code: String!
  qr_code: String!
  reward: Reward!
  user: User!
  status: String!
  redeem_date: DateTime!
  used_date: DateTime
  expiry_date: DateTime
}

type RewardItem {
  id: ID!
  title: String!
  description: String!
  image: String
  pointsRequired: Int!
  category: String!
  partner: String
  inStock: Boolean!
  likes: Int
  redeemed: Int
  isLimited: Boolean!
  expiresAt: String
  tier: String
}

type RedeemHistoryItem {
  id: ID!
  reward: RewardItem!
  redeemedAt: String!
  status: String!
  qrCode: String
  expiresAt: String
  usedAt: String
}

type RedemptionEligibility {
  eligible: Boolean!
  reason: String
  pointsNeeded: Int
}

type UserRewardsDto {
  currentPoints: Int!
  tier: String!
  nextTierPoints: Int!
  totalRedeemed: Int!
  rewards: [RewardItemDto!]!
}

type RewardStats {
  total: Int!
  available: Int!
  outOfStock: Int!
  expired: Int!
}

type RewardItemDto {
  id: String!
  title: String!
  description: String
  image: String
  pointsRequired: Int!
  category: String
  partner: String
  inStock: Boolean!
  likes: Int!
  redeemed: Int!
  isLimited: Boolean!
  expiresAt: DateTime
  tier: String!
  qrCode: String!
  redeemCode: String!
  partnerContact: String
  validUntil: DateTime
}

type RedeemHistoryItemDto {
  id: String!
  rewardTitle: String!
  rewardDescription: String
  image: String
  redeemedAt: DateTime!
  pointsSpent: Int!
  isValid: Boolean!
}

type RedeemHistoryDto {
  items: [RedeemHistoryItemDto!]!
  total: Int!
  limit: Int!
  offset: Int!
}

type UsefulVote {
  id: ID!
  post: Post!
  user: User!
  timestamp: DateTime!
}

type VoteStats {
  totalVotes: Int!
  postsWithVotes: Int!
}

type PostVoteData {
  post: Post!
  voteCount: Int!
}

type UserVoteData {
  user: User!
  voteCount: Int!
}

type TripResponse {
  id: ID!
  user: User!
  title: String!
  description: String
  start_date: DateTime!
  end_date: DateTime!
  locations: [String!]
  status: String
  posts: [Post!]
  createdAt: DateTime!
  updatedAt: DateTime!
}

type TripStatsResponse {
  tripId: ID!
  title: String!
  postsCount: Float!
  locationsCount: Float!
  durationDays: Float!
  averageCost: Float!
  averageRating: Float!
}

type TripPaginatedResponse {
  trips: [TripResponse!]!
  total: Float!
  page: Float!
  limit: Float!
  totalPages: Float!
}

type PlaceStatsResponse {
  totalPlaces: Float!
  avgRating: Float!
  types: [String!]!
}

type CollaboratorResponse {
  id: ID!
  trip: Trip!
  user: User!
  role: String!
  invitedBy: String
  isAccepted: Boolean!
  invitedAt: DateTime!
  acceptedAt: DateTime
  updatedAt: DateTime!
}

type CollaboratorsListResponse {
  collaborators: [CollaboratorResponse!]!
  total: Float!
}

type ItineraryActivityResponse {
  id: ID!
  title: String!
  description: String
  startTime: String!
  endTime: String!
  location: String
  placeId: String
  category: String
  notes: String
  estimatedCost: Float
  isCompleted: Boolean!
  priority: Float
  createdAt: DateTime!
  updatedAt: DateTime!
}

type ItineraryResponse {
  id: ID!
  dayNumber: Float!
  date: DateTime!
  title: String
  description: String
  activities: [ItineraryActivityResponse!]
  createdAt: DateTime!
  updatedAt: DateTime!
}

type ItineraryStatsResponse {
  dayNumber: Float!
  date: DateTime!
  totalActivities: Float!
  completedActivities: Float!
  totalEstimatedCost: Float!
  firstActivityTime: String!
  lastActivityTime: String!
  categories: [String!]!
  scheduleUtilization: Float!
}

type Query {
  getUsers: [User!]!
  getUser(id: String!): User!
  me: User
  getNotificationSettings: NotificationSettings
  getPrivacySettings: PrivacySettings
  getProfile: User!
  myFriends: [User!]!
  getFollowers(userId: String!): [User!]!
  getFollowings(userId: String!): [User!]!
  isFollowing(userId: String!): Boolean!
  getPostLikes(postId: String!): [Like!]!
  hasUserLikedPost(postId: String!): Boolean!
  getPostLikeCount(postId: String!): Float!
  getUserLikedPosts(userId: String!): [Post!]!
  getUserFavoriteCheckins(userId: String!): [Checkin!]!
  isCheckinFavorited(checkinId: String!): Boolean!
  getUserFavoritePlaces(userId: String!): [Place!]!
  isPlaceFavorited(placeId: String!): Boolean!
  getPlaceFavoriteCount(placeId: String!): Float!
  getCheckinLikes(checkinId: String!): [CheckinLike!]!
  hasUserLikedCheckin(checkinId: String!): Boolean!
  getCheckinLikeCount(checkinId: String!): Float!
  getCheckinComments(checkinId: String!): [CheckinComment!]!
  getTripLikes(tripId: String!): [TripLike!]!
  hasUserLikedTrip(tripId: String!): Boolean!
  getTripLikeCount(tripId: String!): Float!
  getTripComments(tripId: String!): [TripComment!]!
  myCheckins: [Checkin!]!
  myCheckinsByNearLocation(lat: Float!, lng: Float!, radiusKm: Float, page: Int, limit: Int): [Checkin!]!
  allCheckinsByNearByLocation(lat: Float!, lng: Float!, radiusKm: Float, page: Int, limit: Int): [Checkin!]!
  myFriendsCheckins(page: Int, limit: Int): [Checkin!]!
  myFriendCheckinsByLocation(lat: Float!, lng: Float!, radiusKm: Float, page: Int, limit: Int): [Checkin!]!
  placeCheckins(mapboxId: String!, page: Int, limit: Int): [Checkin!]!
  placeCheckinsByFriends(mapboxId: String!, page: Int, limit: Int): [Checkin!]!
  myCheckinForPlace(mapboxId: String!): Checkin
  hasCheckedIn(mapboxId: String!): Boolean!
  nearestPlaces(lat: Float!, lng: Float!): [Place!]!
  searchPlaces(keyword: String!, lat: Float!, lng: Float!): [SearchPlace!]!
  nearbyPlaces(lat: Float!, lng: Float!, radius: Float): [SearchPlace!]!
  getPostComments(postId: String!): [Comment!]!
  getComment(id: String!): Comment
  getPost(id: String!): Post
  media(id: ID!): Media
  postMedia(postId: ID!): [Media!]!
  mediaCount(postId: ID!): Int!
  rewards(limit: Int! = 100, offset: Int! = 0): [Reward!]!
  rewardCount: Int!
  reward(id: ID!): Reward
  availableRewards: [Reward!]!
  rewardsByCategory(category: String!): [Reward!]!
  getRewardStats: RewardStats!
  getUserVouchers(status: String): [VoucherDetailsResponse!]!
  checkRedemptionEligibility(rewardId: ID!): RedemptionEligibility!
  userRewards(limit: Int! = 20, offset: Int! = 0): UserRewardsDto!
  getRewardDetail(id: ID!): RewardItemDto
  getRedeemHistory(limit: Int! = 20, offset: Int! = 0): RedeemHistoryDto!
  getPointsSummary: PointsSummaryResponse!
  getTransactionHistory(limit: Float! = 50, offset: Float! = 0): [PointLedger!]!
  getPointsRules: [String!]!
  getUserCurrentPoints: Float!
  getUserCurrentLevel: String!
  postVoteCount(postId: ID!): Int!
  hasUserVoted(postId: ID!): Boolean!
  postVotes(postId: ID!, limit: Int! = 50, offset: Int! = 0): [UsefulVote!]!
  userVotes(userId: ID!, limit: Int! = 50, offset: Int! = 0): [UsefulVote!]!
  userVoteCount(userId: ID!): Int!
  mostVotedPosts(limit: Int! = 10): [PostVoteData!]!
  mostHelpfulUsers(limit: Int! = 10): [UserVoteData!]!
  userPostsVoteStats(userId: ID!): VoteStats!
  myPostsVoteStats: VoteStats!

  """Get a trip by ID"""
  tripById(id: ID!): TripResponse!

  """Get all trips for authenticated user"""
  myTrips(page: ID, limit: ID): TripPaginatedResponse!

  """Get upcoming trips for authenticated user"""
  upcomingTrips(limit: ID): [TripResponse!]!

  """Get past trips for authenticated user"""
  pastTrips(limit: ID): [TripResponse!]!

  """Get trips by specific month"""
  tripsByMonth(month: ID!, year: ID!): [TripResponse!]!

  """Get all posts associated with a trip"""
  tripPosts(tripId: ID!): [Post!]!

  """Get statistics for a trip"""
  tripStats(tripId: ID!): TripStatsResponse!

  """Get all places in a trip"""
  tripPlaces(tripId: ID!): [Place!]!

  """Get all trips that contain a specific place"""
  placeTrips(placeId: ID!): [Trip!]!

  """Get statistics about places in a trip"""
  tripPlacesStats(tripId: ID!): PlaceStatsResponse!

  """Get all collaborators for a trip"""
  tripCollaborators(tripId: ID!): CollaboratorsListResponse!

  """Get pending invitations for a trip"""
  tripPendingInvitations(tripId: ID!): [CollaboratorResponse!]!

  """Get all collaboration invitations for authenticated user"""
  myInvitations: [CollaboratorResponse!]!

  """Get all trips shared with authenticated user"""
  sharedTrips: [TripResponse!]!

  """Get all itineraries for a trip (sorted by day)"""
  tripItineraries(tripId: ID!): [ItineraryResponse!]!

  """Get itinerary for a specific day"""
  itineraryByDay(tripId: ID!, dayNumber: Float!): ItineraryResponse!

  """Get all activities for an itinerary (sorted by time)"""
  itineraryActivities(itineraryId: ID!): [ItineraryActivityResponse!]!

  """Get statistics for a specific itinerary"""
  itineraryStats(itineraryId: ID!): ItineraryStatsResponse!

  """Get statistics for all itineraries in a trip"""
  tripItineraryStats(tripId: ID!): [ItineraryStatsResponse!]!
}

type Mutation {
  updateProfile(input: UpdateProfileInput!): UpdateProfileResponse!
  updateUserAvatar(avatarUrl: String!): AvatarUpdateResponse!
  updateNotificationSettings(input: NotificationSettingsInput!): SettingsUpdateResponse!
  updatePrivacySettings(input: PrivacySettingsInput!): SettingsUpdateResponse!
  signup(input: SignupInput!): AuthResponse!
  login(input: LoginInput!): AuthResponse!
  oauthLogin(input: OAuthInput!): AuthResponse!
  refreshToken(refreshToken: String!): AuthResponse!
  changePassword(userId: String!, currentPassword: String!, newPassword: String!): AuthResponse!
  forgetPassword(email: String!): AuthResponse!
  sendFriendRequest(toUserId: String!): Friendship!
  acceptFriendRequest(requestId: String!): Friendship!
  unfriend(friendId: String!): Boolean!
  followUser(userId: String!): User!
  unfollowUser(userId: String!): Boolean!
  likePost(postId: String!): Like!
  unlikePost(postId: String!): Boolean!
  addCheckinFavorite(checkinId: String!): CheckinFavorite!
  removeCheckinFavorite(checkinId: String!): Boolean!
  addPlaceFavorite(placeId: String!): PlaceFavorite!
  removePlaceFavorite(placeId: String!): Boolean!
  toggleLikeCheckin(checkinId: String!): ToggleLikeResponse!
  createCheckinComment(checkinId: String!, content: String!, parentId: String): CheckinComment!
  deleteCheckinComment(commentId: String!): Boolean!
  toggleLikeTrip(tripId: String!): ToggleLikeResponse!
  createTripComment(tripId: String!, content: String!, parentId: String): TripComment!
  deleteTripComment(commentId: String!): Boolean!
  checkin(data: CreateCheckinInput!): Checkin!
  createPlace(input: CreatePlaceInput!): Place!
  createComment(postId: String!, content: String!): Comment!
  updateComment(id: String!, content: String!): Comment!
  deleteComment(id: String!): Boolean!
  createPost(input: CreatePostInput!): Post!
  createMedia(postId: ID!, data: MediaInput!): Media!
  updateMedia(id: ID!, data: MediaInput!): Media!
  deleteMedia(id: ID!): Boolean!
  deletePostMedia(postId: ID!): Int!
  createReward(data: CreateRewardInput!): Reward!
  updateReward(id: ID!, data: UpdateRewardInput!): Reward!
  deleteReward(id: ID!): Boolean!
  redeemReward(rewardId: ID!): RedeemRewardResponse!
  voteUseful(postId: ID!): UsefulVote!
  removeVote(postId: ID!): Boolean!

  """Create a new trip for authenticated user"""
  createTrip(input: CreateTripInput!): TripResponse!

  """Update an existing trip"""
  updateTrip(input: UpdateTripInput!): TripResponse!

  """Delete a trip"""
  deleteTrip(id: ID!): Boolean!

  """Add a post to a trip"""
  addPostToTrip(tripId: ID!, postId: ID!): Post!

  """Remove a post from a trip"""
  removePostFromTrip(postId: ID!): Post!

  """Update trip status"""
  updateTripStatus(tripId: ID!, status: String!): TripResponse!

  """Add a location to trip"""
  addLocationToTrip(tripId: ID!, location: String!): TripResponse!

  """Remove a location from trip"""
  removeLocationFromTrip(tripId: ID!, location: String!): TripResponse!

  """Add a place to trip"""
  addPlaceToTrip(tripId: ID!, placeId: ID!): TripResponse!

  """Remove a place from trip"""
  removePlaceFromTrip(tripId: ID!, placeId: ID!): TripResponse!

  """Invite a collaborator to a trip"""
  inviteCollaborator(input: InviteCollaboratorInput!): CollaboratorResponse!

  """Accept a collaboration invitation"""
  acceptInvitation(collaboratorId: ID!): CollaboratorResponse!

  """Reject a collaboration invitation"""
  rejectInvitation(collaboratorId: ID!): Boolean!

  """Remove a collaborator from a trip"""
  removeCollaborator(collaboratorId: ID!): Boolean!

  """Update a collaborator role"""
  updateCollaboratorRole(input: UpdateCollaboratorRoleInput!): CollaboratorResponse!

  """Create a new daily itinerary for a trip"""
  createItinerary(input: CreateItineraryInput!): ItineraryResponse!

  """Update an existing itinerary"""
  updateItinerary(input: UpdateItineraryInput!): ItineraryResponse!

  """Delete an itinerary and all its activities"""
  deleteItinerary(id: ID!): Boolean!

  """Create a new activity in an itinerary"""
  createActivity(input: CreateActivityInput!): ItineraryActivityResponse!

  """Update an existing activity"""
  updateActivity(input: UpdateActivityInput!): ItineraryActivityResponse!

  """Delete an activity from an itinerary"""
  deleteActivity(id: ID!): Boolean!

  """Mark an activity as complete"""
  markActivityComplete(activityId: ID!): ItineraryActivityResponse!
}

input UpdateProfileInput {
  name: String
  email: String
  phone: String
  avatar: String
  dateOfBirth: String
  gender: String
  location: String
  bio: String
  interests: [String!]
  country: String
  hobby: String
}

input NotificationSettingsInput {
  pushNotifications: Boolean
  emailNotifications: Boolean
  smsNotifications: Boolean
  promotions: Boolean
  updates: Boolean
  reminders: Boolean
}

input PrivacySettingsInput {
  locationAccess: Boolean
  contactsAccess: Boolean
  cameraAccess: Boolean
  microphoneAccess: Boolean
  profileVisibility: String
  activityStatus: Boolean
}

input SignupInput {
  name: String!
  email: String!
  password: String!
}

input LoginInput {
  email: String!
  password: String!
}

input OAuthInput {
  provider: String!
  providerId: String!
  email: String!
  name: String!
  avatar: String
}

input CreateCheckinInput {
  placeId: ID
  mapboxId: String
  status: String!
  mood: String
}

input CreatePlaceInput {
  name: String!
  address: String
  types: [String!]
  lat: Float!
  lng: Float!
  thumbnail: String
  mapboxId: String
}

input CreatePostInput {
  placeId: ID!
  content: String
  images: [String!]
  tags: [String!]
  cost: Float
  rating: Float
  media: [MediaInput!]
}

input MediaInput {
  url: String!
  type: String
}

input CreateRewardInput {
  title: String!
  description: String!
  category: String!
  points_required: Float!
  image_url: String!
  stock: Float
  expiry_date: DateTime
  partner_id: String
}

input UpdateRewardInput {
  title: String
  description: String
  stock: Float
  status: String
  expiry_date: DateTime
}

input CreateTripInput {
  title: String!
  description: String
  start_date: DateTime!
  end_date: DateTime!
  locations: [String!]
  status: String
}

input UpdateTripInput {
  title: String
  description: String
  start_date: DateTime
  end_date: DateTime
  locations: [String!]
  status: String
  id: ID!
}

input InviteCollaboratorInput {
  tripId: ID!
  collaboratorEmail: String!
  role: String
}

input UpdateCollaboratorRoleInput {
  collaboratorId: ID!
  role: String!
}

input CreateItineraryInput {
  tripId: ID!
  dayNumber: Float!
  date: DateTime!
  title: String
  description: String
}

input UpdateItineraryInput {
  id: ID!
  title: String
  description: String
}

input CreateActivityInput {
  itineraryId: ID!
  title: String!
  description: String
  startTime: String!
  endTime: String!
  location: String
  placeId: String
  category: String
  notes: String
  estimatedCost: Float
  priority: Float
}

input UpdateActivityInput {
  id: ID!
  title: String
  description: String
  startTime: String
  endTime: String
  location: String
  placeId: String
  category: String
  notes: String
  estimatedCost: Float
  isCompleted: Boolean
  priority: Float
}

type Subscription {
  checkinLiked(checkinId: String!): CheckinLikeEvent!
  checkinCommented(checkinId: String!): CheckinCommentEvent!
  tripLiked(tripId: String!): TripLikeEvent!
  tripCommented(tripId: String!): TripCommentEvent!
  postLiked(postId: String!): PostLikeEvent!
}