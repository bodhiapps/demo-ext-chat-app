// OAuth configuration constants
export const APP_CLIENT_ID = 'app-a05c53c5-3fc4-409d-833d-f4acc90e1611'
export const BODHI_AUTH_URL = 'https://main-id.getbodhi.app'
export const AUTH_REALM = 'bodhi'
export const REDIRECT_URI = `${window.location.origin}/callback`

// Storage keys
export const STORAGE_KEYS = {
  RESOURCE_SCOPE: 'bodhi_resource_scope',
  ACCESS_TOKEN: 'bodhi_access_token',
  REFRESH_TOKEN: 'bodhi_refresh_token',
  CODE_VERIFIER: 'bodhi_code_verifier',
  STATE: 'bodhi_state',
} as const

// API endpoints
export const ENDPOINTS = {
  REQUEST_ACCESS: '/bodhi/v1/auth/request-access',
  USER_INFO: '/bodhi/v1/user',
} as const

// Extension configuration
export const EXTENSION_CONFIG = {
  DETECTION_TIMEOUT: 10000, // 10 seconds
  POLLING_INTERVAL: 100, // 100ms
} as const
