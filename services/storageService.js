import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage Service
 * Handles all AsyncStorage operations with caching support
 */

const STORAGE_KEYS = {
  USER_PROFILE: '@battleitout:user_profile',
  USER_VIDEOS: '@battleitout:user_videos',
  USER_BATTLES: '@battleitout:user_battles',
  USER_SAVED: '@battleitout:user_saved',
  CONVERSATIONS: '@battleitout:conversations',
  NOTIFICATIONS: '@battleitout:notifications',
  CACHE_TIMESTAMP: '@battleitout:cache_timestamp',
  AUTH_USER_ID: '@battleitout:auth_user_id',
};

// Cache expiration time (5 minutes)
const CACHE_EXPIRY = 5 * 60 * 1000;

/**
 * Get cached data with timestamp check
 * @param {string} key - Storage key
 * @returns {Promise<Object|null>} Cached data or null if expired/not found
 */
export const getCachedData = async (key) => {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is expired
    if (now - timestamp > CACHE_EXPIRY) {
      console.log(`⏰ Cache expired for ${key}, removing...`);
      await AsyncStorage.removeItem(key);
      return null;
    }

    console.log(`✅ Cache hit for ${key}`);
    return data;
  } catch (error) {
    console.error(`❌ Error reading cache for ${key}:`, error);
    return null;
  }
};

/**
 * Set cached data with timestamp
 * @param {string} key - Storage key
 * @param {*} data - Data to cache
 * @returns {Promise<void>}
 */
export const setCachedData = async (key, data) => {
  try {
    const cacheObject = {
      data,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(cacheObject));
    console.log(`💾 Cached data for ${key}`);
  } catch (error) {
    console.error(`❌ Error caching data for ${key}:`, error);
  }
};

/**
 * Remove cached data
 * @param {string} key - Storage key
 * @returns {Promise<void>}
 */
export const removeCachedData = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
    console.log(`🗑️ Removed cache for ${key}`);
  } catch (error) {
    console.error(`❌ Error removing cache for ${key}:`, error);
  }
};

/**
 * Clear all app cache
 * @returns {Promise<void>}
 */
export const clearAllCache = async () => {
  try {
    const keys = Object.values(STORAGE_KEYS);
    await AsyncStorage.multiRemove(keys);
    console.log('🗑️ Cleared all cache');
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
  }
};

/**
 * Get user profile from cache
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>}
 */
export const getCachedUserProfile = async (userId) => {
  const key = `${STORAGE_KEYS.USER_PROFILE}:${userId}`;
  return getCachedData(key);
};

/**
 * Cache user profile
 * @param {string} userId - User ID
 * @param {Object} profile - Profile data
 * @returns {Promise<void>}
 */
export const setCachedUserProfile = async (userId, profile) => {
  const key = `${STORAGE_KEYS.USER_PROFILE}:${userId}`;
  return setCachedData(key, profile);
};

/**
 * Get user videos from cache
 * @param {string} userId - User ID
 * @returns {Promise<Array|null>}
 */
export const getCachedUserVideos = async (userId) => {
  const key = `${STORAGE_KEYS.USER_VIDEOS}:${userId}`;
  return getCachedData(key);
};

/**
 * Cache user videos
 * @param {string} userId - User ID
 * @param {Array} videos - Videos array
 * @returns {Promise<void>}
 */
export const setCachedUserVideos = async (userId, videos) => {
  const key = `${STORAGE_KEYS.USER_VIDEOS}:${userId}`;
  return setCachedData(key, videos);
};

/**
 * Get user battles from cache
 * @param {string} userId - User ID
 * @returns {Promise<Array|null>}
 */
export const getCachedUserBattles = async (userId) => {
  const key = `${STORAGE_KEYS.USER_BATTLES}:${userId}`;
  return getCachedData(key);
};

/**
 * Cache user battles
 * @param {string} userId - User ID
 * @param {Array} battles - Battles array
 * @returns {Promise<void>}
 */
export const setCachedUserBattles = async (userId, battles) => {
  const key = `${STORAGE_KEYS.USER_BATTLES}:${userId}`;
  return setCachedData(key, battles);
};

/**
 * Get user saved videos from cache
 * @param {string} userId - User ID
 * @returns {Promise<Array|null>}
 */
export const getCachedUserSaved = async (userId) => {
  const key = `${STORAGE_KEYS.USER_SAVED}:${userId}`;
  return getCachedData(key);
};

/**
 * Cache user saved videos
 * @param {string} userId - User ID
 * @param {Array} saved - Saved videos array
 * @returns {Promise<void>}
 */
export const setCachedUserSaved = async (userId, saved) => {
  const key = `${STORAGE_KEYS.USER_SAVED}:${userId}`;
  return setCachedData(key, saved);
};

/**
 * Get conversations from cache
 * @param {string} userId - User ID
 * @returns {Promise<Array|null>}
 */
export const getCachedConversations = async (userId) => {
  const key = `${STORAGE_KEYS.CONVERSATIONS}:${userId}`;
  return getCachedData(key);
};

/**
 * Cache conversations
 * @param {string} userId - User ID
 * @param {Array} conversations - Conversations array
 * @returns {Promise<void>}
 */
export const setCachedConversations = async (userId, conversations) => {
  const key = `${STORAGE_KEYS.CONVERSATIONS}:${userId}`;
  return setCachedData(key, conversations);
};

/**
 * Get notifications from cache
 * @param {string} userId - User ID
 * @returns {Promise<Array|null>}
 */
export const getCachedNotifications = async (userId) => {
  const key = `${STORAGE_KEYS.NOTIFICATIONS}:${userId}`;
  return getCachedData(key);
};

/**
 * Cache notifications
 * @param {string} userId - User ID
 * @param {Array} notifications - Notifications array
 * @returns {Promise<void>}
 */
export const setCachedNotifications = async (userId, notifications) => {
  const key = `${STORAGE_KEYS.NOTIFICATIONS}:${userId}`;
  return setCachedData(key, notifications);
};

/**
 * Save authenticated user ID to AsyncStorage
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const saveAuthUserId = async (userId) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_USER_ID, userId);
    console.log(`✅ Saved auth user ID: ${userId}`);
  } catch (error) {
    console.error(`❌ Error saving auth user ID:`, error);
  }
};

/**
 * Get authenticated user ID from AsyncStorage
 * @returns {Promise<string|null>}
 */
export const getAuthUserId = async () => {
  try {
    const userId = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_USER_ID);
    return userId;
  } catch (error) {
    console.error(`❌ Error getting auth user ID:`, error);
    return null;
  }
};

/**
 * Clear authenticated user ID from AsyncStorage
 * @returns {Promise<void>}
 */
export const clearAuthUserId = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_USER_ID);
    console.log(`🗑️ Cleared auth user ID`);
  } catch (error) {
    console.error(`❌ Error clearing auth user ID:`, error);
  }
};

/**
 * Invalidate cache for a specific user
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const invalidateUserCache = async (userId) => {
  try {
    const keys = [
      `${STORAGE_KEYS.USER_PROFILE}:${userId}`,
      `${STORAGE_KEYS.USER_VIDEOS}:${userId}`,
      `${STORAGE_KEYS.USER_BATTLES}:${userId}`,
      `${STORAGE_KEYS.USER_SAVED}:${userId}`,
      `${STORAGE_KEYS.CONVERSATIONS}:${userId}`,
      `${STORAGE_KEYS.NOTIFICATIONS}:${userId}`,
    ];
    await AsyncStorage.multiRemove(keys);
    console.log(`🗑️ Invalidated cache for user ${userId}`);
  } catch (error) {
    console.error(`❌ Error invalidating cache for user ${userId}:`, error);
  }
};

export default {
  getCachedData,
  setCachedData,
  removeCachedData,
  clearAllCache,
  getCachedUserProfile,
  setCachedUserProfile,
  getCachedUserVideos,
  setCachedUserVideos,
  getCachedUserBattles,
  setCachedUserBattles,
  getCachedUserSaved,
  setCachedUserSaved,
  getCachedConversations,
  setCachedConversations,
  getCachedNotifications,
  setCachedNotifications,
  saveAuthUserId,
  getAuthUserId,
  clearAuthUserId,
  invalidateUserCache,
  STORAGE_KEYS,
};


