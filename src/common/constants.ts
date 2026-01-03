// Business logic constants
export const CONSTANTS = {
  // Check-in status values
  CHECKIN_STATUS: {
    CHECKED_IN: 'checked_in',
    PUBLIC: 'public',
    PRIVATE: 'private',
  } as const,

  // JWT configuration
  JWT: {
    EXPIRATION: {
      ACCESS_TOKEN: '1h',
      REFRESH_TOKEN: '7d',
    },
  },

  // Cache TTL values (in seconds)
  CACHE_TTL: {
    PLACE_DETAILS: 24 * 60 * 60, // 24 hours
    NEARBY: 3600, // 1 hour
    SEARCH: 7200, // 2 hours
    GEOCODING: 24 * 60 * 60, // 24 hours
  },

  // Pagination defaults
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
  },

  // Rate limiting
  RATE_LIMIT: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 100,
    BLOCK_DURATION: 5 * 60, // 5 minutes
  },

  // Password requirements
  PASSWORD: {
    MIN_LENGTH: 8,
    SALT_ROUNDS: 10,
  },

  // OAuth
  OAUTH: {
    DEFAULT_AVATAR: null,
  },
} as const;

// Type exports
export type CheckinStatus = typeof CONSTANTS.CHECKIN_STATUS[keyof typeof CONSTANTS.CHECKIN_STATUS];

