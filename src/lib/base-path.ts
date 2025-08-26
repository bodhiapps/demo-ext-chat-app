/**
 * Centralized utility for getting the application's base path
 * This ensures consistent behavior between development and production environments
 * for GitHub Pages deployment compatibility
 */

/**
 * Get the base path for the application
 * Returns the repository name as path (e.g., '/demo-ext-chat-app') for consistent routing
 */
export function getBasePath(): string {
  // Get the repository name from package.json via import.meta.env.BASE_URL
  // In Vite, BASE_URL is set by the base config option
  const baseUrl = import.meta.env.BASE_URL

  // Remove trailing slash and ensure it starts with /
  const cleanedPath = baseUrl.replace(/\/$/, '')

  // If it's just '/', return empty string (for root deployments)
  return cleanedPath === '' ? '' : cleanedPath
}

/**
 * Get the full base URL including origin and base path
 * Useful for constructing absolute URLs like OAuth callbacks
 */
export function getBaseUrl(): string {
  const basePath = getBasePath()
  return `${window.location.origin}${basePath}`
}

/**
 * Navigate to a route with correct base path handling
 * @param route - The route to navigate to (e.g., '/chat', '/callback')
 */
export function navigateToRoute(route: string): void {
  const basePath = getBasePath()
  const fullPath = `${basePath}${route}`
  window.location.href = fullPath
}

/**
 * Navigate to the app root with correct base path handling
 */
export function navigateToRoot(): void {
  const basePath = getBasePath()
  // Ensure we have a trailing slash for proper directory navigation
  const rootPath = basePath ? `${basePath}/` : '/'
  window.location.href = rootPath
}

/**
 * Check if current path matches a route, accounting for base path
 * @param route - The route to check (e.g., '/chat', '/callback')
 */
export function isCurrentRoute(route: string): boolean {
  const basePath = getBasePath()
  const fullPath = `${basePath}${route}`
  return window.location.pathname === route || window.location.pathname === fullPath
}

/**
 * Construct an absolute URL with base path
 * @param path - The path to append (e.g., '/callback')
 */
export function getAbsoluteUrl(path: string): string {
  const baseUrl = getBaseUrl()
  return `${baseUrl}${path}`
}
