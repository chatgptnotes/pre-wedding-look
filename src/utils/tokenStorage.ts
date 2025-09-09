import Cookies from 'js-cookie';

// Cookie configuration for secure token storage
const COOKIE_CONFIG = {
  secure: process.env.NODE_ENV === 'production', // Only secure in production
  sameSite: 'strict' as const, // CSRF protection
  expires: 7, // 7 days expiration
  httpOnly: false, // Must be false for client-side access
  path: '/', // Available site-wide
};

// Cookie names for different tokens
const COOKIE_NAMES = {
  ACCESS_TOKEN: 'supabase_access_token',
  REFRESH_TOKEN: 'supabase_refresh_token',
  USER_ID: 'supabase_user_id',
  TOKEN_EXPIRES_AT: 'supabase_token_expires_at',
} as const;

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  userId: string;
  expiresAt: number; // Unix timestamp
}

/**
 * Store authentication tokens securely in cookies
 */
export const storeTokens = (tokenData: TokenData): void => {
  try {
    console.log('🍪 Storing authentication tokens in cookies');
    
    // Store access token
    Cookies.set(COOKIE_NAMES.ACCESS_TOKEN, tokenData.accessToken, COOKIE_CONFIG);
    
    // Store refresh token with longer expiration
    Cookies.set(COOKIE_NAMES.REFRESH_TOKEN, tokenData.refreshToken, {
      ...COOKIE_CONFIG,
      expires: 30, // 30 days for refresh token
    });
    
    // Store user ID for quick access
    Cookies.set(COOKIE_NAMES.USER_ID, tokenData.userId, COOKIE_CONFIG);
    
    // Store expiration timestamp
    Cookies.set(COOKIE_NAMES.TOKEN_EXPIRES_AT, tokenData.expiresAt.toString(), COOKIE_CONFIG);
    
    console.log('✅ Tokens stored successfully in cookies');
    console.log('📅 Access token expires at:', new Date(tokenData.expiresAt * 1000).toISOString());
  } catch (error) {
    console.error('❌ Failed to store tokens in cookies:', error);
    throw new Error('Token storage failed');
  }
};

/**
 * Retrieve authentication tokens from cookies
 */
export const getTokens = (): TokenData | null => {
  try {
    const accessToken = Cookies.get(COOKIE_NAMES.ACCESS_TOKEN);
    const refreshToken = Cookies.get(COOKIE_NAMES.REFRESH_TOKEN);
    const userId = Cookies.get(COOKIE_NAMES.USER_ID);
    const expiresAtStr = Cookies.get(COOKIE_NAMES.TOKEN_EXPIRES_AT);
    
    // Check if all required tokens exist
    if (!accessToken || !refreshToken || !userId || !expiresAtStr) {
      console.log('⚠️ Some authentication tokens missing from cookies');
      return null;
    }
    
    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt)) {
      console.error('❌ Invalid token expiration timestamp in cookies');
      return null;
    }
    
    const tokenData = {
      accessToken,
      refreshToken,
      userId,
      expiresAt,
    };
    
    console.log('✅ Retrieved tokens from cookies');
    console.log('📅 Token expires at:', new Date(expiresAt * 1000).toISOString());
    
    return tokenData;
  } catch (error) {
    console.error('❌ Failed to retrieve tokens from cookies:', error);
    return null;
  }
};

/**
 * Get just the access token for API calls
 */
export const getAccessToken = (): string | null => {
  try {
    const accessToken = Cookies.get(COOKIE_NAMES.ACCESS_TOKEN);
    if (accessToken) {
      console.log('✅ Access token retrieved from cookie');
      return accessToken;
    }
    console.log('⚠️ No access token found in cookies');
    return null;
  } catch (error) {
    console.error('❌ Failed to get access token from cookies:', error);
    return null;
  }
};

/**
 * Check if the current access token is expired or will expire soon
 */
export const isTokenExpired = (bufferMinutes: number = 5): boolean => {
  try {
    const expiresAtStr = Cookies.get(COOKIE_NAMES.TOKEN_EXPIRES_AT);
    if (!expiresAtStr) {
      console.log('⚠️ No token expiration info found');
      return true;
    }
    
    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt)) {
      console.error('❌ Invalid token expiration timestamp');
      return true;
    }
    
    // Check if token expires within buffer time
    const bufferTime = bufferMinutes * 60 * 1000; // Convert to milliseconds
    const expirationTime = expiresAt * 1000; // Convert to milliseconds
    const now = Date.now();
    
    const isExpired = now + bufferTime >= expirationTime;
    
    if (isExpired) {
      console.log('⏰ Token is expired or will expire soon');
      console.log('⏰ Expires at:', new Date(expirationTime).toISOString());
      console.log('⏰ Current time:', new Date(now).toISOString());
    }
    
    return isExpired;
  } catch (error) {
    console.error('❌ Failed to check token expiration:', error);
    return true; // Assume expired on error
  }
};

/**
 * Clear all authentication tokens from cookies
 */
export const clearTokens = (): void => {
  try {
    console.log('🗑️ Clearing authentication tokens from cookies');
    
    // Remove all auth-related cookies
    Cookies.remove(COOKIE_NAMES.ACCESS_TOKEN, { path: '/' });
    Cookies.remove(COOKIE_NAMES.REFRESH_TOKEN, { path: '/' });
    Cookies.remove(COOKIE_NAMES.USER_ID, { path: '/' });
    Cookies.remove(COOKIE_NAMES.TOKEN_EXPIRES_AT, { path: '/' });
    
    console.log('✅ All authentication tokens cleared from cookies');
  } catch (error) {
    console.error('❌ Failed to clear tokens from cookies:', error);
  }
};

/**
 * Get user ID from cookies
 */
export const getUserId = (): string | null => {
  try {
    const userId = Cookies.get(COOKIE_NAMES.USER_ID);
    if (userId) {
      console.log('✅ User ID retrieved from cookie');
      return userId;
    }
    console.log('⚠️ No user ID found in cookies');
    return null;
  } catch (error) {
    console.error('❌ Failed to get user ID from cookies:', error);
    return null;
  }
};

/**
 * Debug function to log all current token information
 */
export const debugTokens = (): void => {
  console.log('🔍 DEBUG: Current token status in cookies:');
  
  const tokens = getTokens();
  if (!tokens) {
    console.log('❌ No valid tokens found');
    return;
  }
  
  console.log('✅ Access token present:', !!tokens.accessToken);
  console.log('✅ Refresh token present:', !!tokens.refreshToken);
  console.log('✅ User ID:', tokens.userId);
  console.log('📅 Expires at:', new Date(tokens.expiresAt * 1000).toISOString());
  console.log('⏰ Is expired:', isTokenExpired());
  console.log('⏰ Time until expiry:', Math.round((tokens.expiresAt * 1000 - Date.now()) / 1000 / 60), 'minutes');
};