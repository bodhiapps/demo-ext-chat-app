/**
 * Utility for storing and retrieving error messages for the landing page
 * Used when redirecting users from other pages due to auth failures or other errors
 */

const LANDING_ERROR_KEY = 'landing_page_error'

export interface LandingError {
  message: string
  timestamp: number
}

/**
 * Store an error message to be displayed on the landing page
 * @param message The error message to display to the user
 */
export function storeLandingError(message: string): void {
  try {
    const error: LandingError = {
      message,
      timestamp: Date.now(),
    }
    localStorage.setItem(LANDING_ERROR_KEY, JSON.stringify(error))
  } catch (error) {
    console.warn('Failed to store landing error:', error)
  }
}

/**
 * Retrieve and clear the stored error message for the landing page
 * @returns The error message if one exists, null otherwise
 */
export function getLandingError(): string | null {
  try {
    const stored = localStorage.getItem(LANDING_ERROR_KEY)
    if (!stored) {
      return null
    }

    const error: LandingError = JSON.parse(stored)

    // Clear the error after retrieving it
    clearLandingError()

    // Check if error is not too old (24 hours max)
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    if (Date.now() - error.timestamp > maxAge) {
      return null
    }

    return error.message
  } catch (error) {
    console.warn('Failed to retrieve landing error:', error)
    clearLandingError() // Clear potentially corrupted data
    return null
  }
}

/**
 * Manually clear the stored error message
 */
export function clearLandingError(): void {
  try {
    localStorage.removeItem(LANDING_ERROR_KEY)
  } catch (error) {
    console.warn('Failed to clear landing error:', error)
  }
}

/**
 * Check if there's a stored error message without retrieving it
 * @returns true if there's a stored error, false otherwise
 */
export function hasLandingError(): boolean {
  try {
    const stored = localStorage.getItem(LANDING_ERROR_KEY)
    return stored !== null
  } catch {
    return false
  }
}
