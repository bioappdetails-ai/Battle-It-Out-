import { getCurrentUser } from './authService';
import { updateDocument, getDocument, COLLECTIONS, serverTimestamp } from './firestoreService';
import { AppState } from 'react-native';

/**
 * Online Status Service
 * Tracks user online/offline status
 */

let statusUpdateInterval = null;
let appStateSubscription = null;
let currentUserId = null;

/**
 * Set user online status
 * @param {string} userId - User ID
 * @param {boolean} isOnline - Online status
 * @returns {Promise<void>}
 */
export const setUserOnlineStatus = async (userId, isOnline) => {
  try {
    if (!userId) return;

    await updateDocument(COLLECTIONS.USERS, userId, {
      isOnline: isOnline,
      lastSeen: serverTimestamp(),
    });

    console.log(`✅ User ${userId} status set to ${isOnline ? 'online' : 'offline'}`);
  } catch (error) {
    console.error('Error setting user online status:', error);
  }
};

/**
 * Get user online status
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if user is online
 */
export const getUserOnlineStatus = async (userId) => {
  try {
    if (!userId) return false;

    const user = await getDocument(COLLECTIONS.USERS, userId);
    return user?.isOnline || false;
  } catch (error) {
    console.error('Error getting user online status:', error);
    return false;
  }
};

/**
 * Start tracking current user's online status
 * Updates status when app goes to foreground/background
 */
export const startOnlineStatusTracking = () => {
  const user = getCurrentUser();
  if (!user || !user.uid) {
    return;
  }

  currentUserId = user.uid;

  // Set online when tracking starts
  setUserOnlineStatus(currentUserId, true).catch(() => {});

  // Update status periodically (every 30 seconds) to keep user online
  statusUpdateInterval = setInterval(() => {
    if (currentUserId && AppState.currentState === 'active') {
      setUserOnlineStatus(currentUserId, true).catch(() => {});
    }
  }, 30000); // 30 seconds

  // Listen to app state changes
  appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
    if (currentUserId) {
      if (nextAppState === 'active') {
        // App is in foreground - set online
        setUserOnlineStatus(currentUserId, true).catch(() => {});
      } else {
        // App is in background - set offline
        setUserOnlineStatus(currentUserId, false).catch(() => {});
      }
    }
  });
};

/**
 * Stop tracking current user's online status
 */
export const stopOnlineStatusTracking = () => {
  if (currentUserId) {
    setUserOnlineStatus(currentUserId, false).catch(() => {});
    currentUserId = null;
  }

  if (statusUpdateInterval) {
    clearInterval(statusUpdateInterval);
    statusUpdateInterval = null;
  }

  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }
};

export default {
  setUserOnlineStatus,
  getUserOnlineStatus,
  startOnlineStatusTracking,
  stopOnlineStatusTracking,
};



