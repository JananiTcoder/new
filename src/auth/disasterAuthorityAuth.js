// Static demo credentials for Disaster Authority login
export const DEMO_DA_CREDENTIALS = {
  userId: 'DA001',
  password: 'GeoSentra@123',
}

/**
 * Validates Disaster Authority credentials.
 * Kept modular so it can be swapped with a real backend authentication API.
 * @param {string} userId 
 * @param {string} password 
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function validateDisasterAuthorityCredentials(userId, password) {
  const trimmedUserId = (userId || '').trim()
  if (trimmedUserId === DEMO_DA_CREDENTIALS.userId && password === DEMO_DA_CREDENTIALS.password) {
    return { success: true }
  }
  return { success: false, error: 'Invalid User ID or Password.' }
}
