import { getCurrentUser } from './authService';
import { 
  getDocuments, 
  createDocument, 
  updateDocument,
  getDocument,
  incrementField,
  COLLECTIONS 
} from './firestoreService';
import { generateUUID } from '../utils/uuid';
import { serverTimestamp } from 'firebase/firestore';

/**
 * View Service
 * Handles video view tracking and counting
 */

// Minimum duration in milliseconds to count as a view (3 seconds)
const MIN_VIEW_DURATION_MS = 3000;

/**
 * Check if a user has already viewed a video
 * @param {string} videoId - Video ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if user has viewed the video
 */
export const hasUserViewed = async (videoId, userId) => {
  try {
    if (!videoId || !userId) {
      return false;
    }

    const views = await getDocuments(
      COLLECTIONS.VIEWS,
      [
        { field: 'videoId', operator: '==', value: videoId },
        { field: 'userId', operator: '==', value: userId },
      ],
      null,
      'desc',
      1
    );

    return views.length > 0;
  } catch (error) {
    console.error('Error checking if user viewed video:', error);
    // Return false on error to allow view recording attempt
    return false;
  }
};

/**
 * Record a view for a video (only if user hasn't viewed before)
 * @param {string} videoId - Video ID
 * @param {string} userId - User ID (optional, will use current user if not provided)
 * @param {string} source - Source of the view ('homescreen', 'discoverscreen', 'battleview', etc.)
 * @param {number} viewDuration - Duration viewed in milliseconds (optional)
 * @returns {Promise<boolean>} True if view was recorded, false if already viewed
 */
export const recordView = async (videoId, userId = null, source = 'unknown', viewDuration = null) => {
  try {
    if (!videoId) {
      console.warn('Cannot record view: videoId is required');
      return false;
    }

    const currentUser = userId ? { uid: userId } : getCurrentUser();
    if (!currentUser || !currentUser.uid) {
      console.warn('Cannot record view: user not authenticated');
      return false;
    }

    const userIdToUse = currentUser.uid;

    // Check if user has already viewed this video
    const alreadyViewed = await hasUserViewed(videoId, userIdToUse);
    if (alreadyViewed) {
      console.log(`User ${userIdToUse} has already viewed video ${videoId}`);
      return false;
    }

    // Create view record
    const viewId = generateUUID();
    const viewData = {
      videoId: videoId,
      userId: userIdToUse,
      viewedAt: serverTimestamp(),
      source: source,
      viewDuration: viewDuration || null,
    };

    await createDocument(COLLECTIONS.VIEWS, viewData, viewId);

    // Increment view count in video document
    try {
      await incrementField(COLLECTIONS.VIDEOS, videoId, 'views', 1);
      console.log(`✅ View recorded for video ${videoId} by user ${userIdToUse}`);
      return true;
    } catch (error) {
      console.error('Error incrementing video views:', error);
      // View record was created but count increment failed
      // This is okay, we can recover by recalculating views if needed
      return true;
    }
  } catch (error) {
    console.error('Error recording view:', error);
    // Don't throw - view tracking failures shouldn't break video playback
    return false;
  }
};

/**
 * Increment video view count (use recordView instead for unique views)
 * @param {string} videoId - Video ID
 * @returns {Promise<void>}
 */
export const incrementVideoViews = async (videoId) => {
  try {
    if (!videoId) {
      throw new Error('videoId is required');
    }
    await incrementField(COLLECTIONS.VIDEOS, videoId, 'views', 1);
  } catch (error) {
    console.error('Error incrementing video views:', error);
    throw error;
  }
};

/**
 * Get current view count for a video
 * @param {string} videoId - Video ID
 * @returns {Promise<number>} Current view count
 */
export const getVideoViews = async (videoId) => {
  try {
    if (!videoId) {
      return 0;
    }

    const video = await getDocument(COLLECTIONS.VIDEOS, videoId);
    return video?.views || 0;
  } catch (error) {
    console.error('Error getting video views:', error);
    return 0;
  }
};

/**
 * Get user's view history
 * @param {string} userId - User ID (optional, will use current user if not provided)
 * @param {number} limit - Maximum number of views to return
 * @returns {Promise<Array>} Array of view records
 */
export const getUserViewHistory = async (userId = null, limit = 50) => {
  try {
    const currentUser = userId ? { uid: userId } : getCurrentUser();
    if (!currentUser || !currentUser.uid) {
      return [];
    }

    const userIdToUse = currentUser.uid;

    const views = await getDocuments(
      COLLECTIONS.VIEWS,
      [{ field: 'userId', operator: '==', value: userIdToUse }],
      'viewedAt',
      'desc',
      limit
    );

    return views;
  } catch (error) {
    console.error('Error getting user view history:', error);
    return [];
  }
};

/**
 * Track view with minimum duration check
 * This function tracks when a video has been viewed for at least MIN_VIEW_DURATION_MS
 * @param {string} videoId - Video ID
 * @param {string} source - Source of the view
 * @param {number} playDuration - Duration video has been playing in milliseconds
 * @param {string} userId - User ID (optional)
 * @returns {Promise<boolean>} True if view was recorded
 */
export const trackViewWithDuration = async (videoId, source, playDuration, userId = null) => {
  try {
    if (!videoId || playDuration < MIN_VIEW_DURATION_MS) {
      return false;
    }

    return await recordView(videoId, userId, source, playDuration);
  } catch (error) {
    console.error('Error tracking view with duration:', error);
    return false;
  }
};

export default {
  recordView,
  hasUserViewed,
  incrementVideoViews,
  getVideoViews,
  getUserViewHistory,
  trackViewWithDuration,
  MIN_VIEW_DURATION_MS,
};




