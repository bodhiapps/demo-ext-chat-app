import { STORAGE_KEYS, BODHI_AUTH_URL, AUTH_REALM, APP_CLIENT_ID } from './extension-constants'

// PKCE utility functions
export class PKCEUtils {
  /**
   * Generate a secure random string for PKCE code verifier
   */
  static generateCodeVerifier(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }

  /**
   * Generate code challenge from verifier
   */
  static async generateCodeChallenge(codeVerifier: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(codeVerifier)
    const digest = await crypto.subtle.digest('SHA-256', data)
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }

  /**
   * Generate a secure random state parameter
   */
  static generateState(): string {
    const array = new Uint8Array(16)
    crypto.getRandomValues(array)
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }
}

/**
 * Build OAuth authorization URL with PKCE parameters
 */
export async function buildAuthUrl(): Promise<string> {
  const resourceScope = localStorage.getItem(STORAGE_KEYS.RESOURCE_SCOPE)
  if (!resourceScope) {
    throw new Error('No resource scope found. Please request access first.')
  }

  console.log('🔧 Building OAuth authorization URL...')
  console.log('📋 Resource scope:', resourceScope)

  // Generate PKCE parameters
  const codeVerifier = PKCEUtils.generateCodeVerifier()
  const codeChallenge = await PKCEUtils.generateCodeChallenge(codeVerifier)
  const state = PKCEUtils.generateState()

  console.log('🔑 Generated PKCE parameters:')
  console.log('  - Code verifier:', codeVerifier ? 'generated' : 'failed')
  console.log('  - Code challenge:', codeChallenge ? 'generated' : 'failed')
  console.log('  - State:', state ? 'generated' : 'failed')

  // Store PKCE parameters
  localStorage.setItem(STORAGE_KEYS.CODE_VERIFIER, codeVerifier)
  localStorage.setItem(STORAGE_KEYS.STATE, state)
  console.log('💾 PKCE parameters stored')

  // Include all required OAuth scopes (matching reference implementation)
  const scopes = ['openid', 'email', 'profile', 'roles', 'scope_user_user', resourceScope]
  const scopeString = scopes.join(' ')
  console.log('📋 OAuth scopes:', scopeString)

  // Build OAuth URL
  const redirectUri = `${window.location.origin}/callback`
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: APP_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: scopeString,
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })

  const authUrl = `${BODHI_AUTH_URL}/realms/${AUTH_REALM}/protocol/openid-connect/auth?${params}`
  console.log('🌐 Authorization URL built:', authUrl.substring(0, 100) + '...')

  return authUrl
}
