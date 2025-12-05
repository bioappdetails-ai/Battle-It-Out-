import { getCurrentUser } from './authService';
import { createDocument, getDocuments, updateDocument, deleteDocument, COLLECTIONS, serverTimestamp } from './firestoreService';
import { generateUUID } from '../utils/uuid';
import { getDocument } from './firestoreService';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Notification Service
 * Handles all notification-related operations
 */

/**
 * Create a notification
 * @param {string} recipientId - User ID who will receive the notification
 * @param {string} type - Notification type ('follow_request', 'battle_request', 'vote', 'battle_expired', 'battle_accepted', 'battle_rejected')
 * @param {Object} data - Additional data for the notification (senderId, battleId, etc.)
 * @returns {Promise<string>} Notification ID
 */
export const createNotification = async (recipientId, type, data = {}) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User must be logged in to create notifications');
    }

    const senderId = data.senderId || currentUser.uid;
    
    // Get sender's profile for notification display
    let senderProfile = null;
    try {
      senderProfile = await getDocument(COLLECTIONS.USERS, senderId);
    } catch (error) {
      console.error('Error fetching sender profile for notification:', error);
    }

    const senderName = senderProfile?.displayName || senderProfile?.userName || senderProfile?.name || 'Someone';
    const senderAvatar = senderProfile?.profileImage || senderProfile?.avatar || null;

    // Generate notification message based on type
    let title = '';
    let message = '';

    switch (type) {
      case 'follow_request':
        title = 'New Follower';
        message = `${senderName} started following you`;
        break;
      case 'battle_request':
        title = 'Battle Request';
        message = `${senderName} sent you a battle request`;
        break;
      case 'vote':
        title = 'New Vote';
        message = `${senderName} voted on your battle`;
        break;
      case 'battle_expired':
        title = 'Battle Expired';
        const opponentName = data.opponentName || 'opponent';
        message = `Your battle with ${opponentName} has expired`;
        break;
      case 'battle_accepted':
        title = 'Battle Accepted';
        message = `${senderName} accepted your battle request`;
        break;
      case 'battle_rejected':
        title = 'Battle Rejected';
        message = `${senderName} rejected your battle request`;
        break;
      default:
        title = 'Notification';
        message = 'You have a new notification';
    }

    const notificationId = generateUUID();
    const notificationData = {
      recipientId,
      senderId,
      senderName,
      senderAvatar,
      type,
      title,
      message,
      data: {
        ...data,
      },
      read: false,
    };

    await createDocument(COLLECTIONS.NOTIFICATIONS, notificationData, notificationId);
    console.log(`✅ Notification created: ${type} for user ${recipientId}`);
    
    // Send push notification (non-blocking)
    sendPushNotification(recipientId, title, message, {
      notificationId: notificationId,
      type: type,
      ...data,
    }).catch((error) => {
      console.error('Error sending push notification (non-blocking):', error);
    });
    
    return notificationId;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Get notifications for a user
 * @param {string} userId - User ID
 * @param {number} limitCount - Maximum number of notifications to return (optional)
 * @returns {Promise<Array>} Array of notifications
 */
export const getNotifications = async (userId, limitCount = null) => {
  try {
    const whereConditions = [
      { field: 'recipientId', operator: '==', value: userId },
    ];

    const notifications = await getDocuments(
      COLLECTIONS.NOTIFICATIONS,
      whereConditions,
      'createdAt',
      'desc',
      limitCount
    );

    return notifications;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Mark a notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise<void>}
 */
export const markAsRead = async (notificationId) => {
  try {
    await updateDocument(COLLECTIONS.NOTIFICATIONS, notificationId, {
      read: true,
    });
    console.log(`✅ Notification ${notificationId} marked as read`);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Delete a notification
 * @param {string} notificationId - Notification ID
 * @returns {Promise<void>}
 */
export const deleteNotification = async (notificationId) => {
  try {
    await deleteDocument(COLLECTIONS.NOTIFICATIONS, notificationId);
    console.log(`✅ Notification ${notificationId} deleted`);
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const markAllAsRead = async (userId) => {
  try {
    const notifications = await getNotifications(userId);
    const unreadNotifications = notifications.filter(n => !n.read);

    // Update all unread notifications
    await Promise.all(
      unreadNotifications.map(notification => 
        updateDocument(COLLECTIONS.NOTIFICATIONS, notification.id, {
          read: true,
        })
      )
    );

    console.log(`✅ Marked ${unreadNotifications.length} notifications as read for user ${userId}`);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Configure notification handler behavior
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register push notification token for a user
 * @param {string} userId - User ID
 * @returns {Promise<string|null>} Push token or null if registration fails
 */
export const registerPushToken = async (userId) => {
  try {
    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.warn('⚠️ Push notification permission not granted');
      return null;
    }

    // Get push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'ab9fb6f4-804a-48b8-957d-c6b77c970b55', // From app.json
    });

    const pushToken = tokenData.data;

    // Save token to user document
    await updateDocument(COLLECTIONS.USERS, userId, {
      pushToken: pushToken,
      pushTokenUpdatedAt: serverTimestamp(),
    });

    console.log(`✅ Push token registered for user ${userId}`);
    return pushToken;
  } catch (error) {
    console.error('Error registering push token:', error);
    return null;
  }
};

/**
 * Get push token for a user
 * @param {string} userId - User ID
 * @returns {Promise<string|null>} Push token or null
 */
export const getPushToken = async (userId) => {
  try {
    const user = await getDocument(COLLECTIONS.USERS, userId);
    return user?.pushToken || null;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
};

/**
 * Send push notification to a user
 * @param {string} recipientId - User ID to send notification to
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data for the notification
 * @returns {Promise<boolean>} True if sent successfully
 */
export const sendPushNotification = async (recipientId, title, body, data = {}) => {
  try {
    const pushToken = await getPushToken(recipientId);
    
    if (!pushToken) {
      console.log(`⚠️ No push token found for user ${recipientId}, skipping push notification`);
      return false;
    }

    // Send notification via Expo Push Notification service
    const message = {
      to: pushToken,
      sound: 'default',
      title: title,
      body: body,
      data: data,
      badge: 1,
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    
    if (result.data?.status === 'ok') {
      console.log(`✅ Push notification sent to user ${recipientId}`);
      return true;
    } else {
      console.error('❌ Failed to send push notification:', result);
      return false;
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
};

/**
 * Create notification and send push notification
 * @param {string} recipientId - User ID who will receive the notification
 * @param {string} type - Notification type
 * @param {Object} data - Additional data for the notification
 * @returns {Promise<string>} Notification ID
 */
export const createNotificationWithPush = async (recipientId, type, data = {}) => {
  try {
    // Create in-app notification
    const notificationId = await createNotification(recipientId, type, data);
    
    // Get notification details for push
    const notification = await getDocument(COLLECTIONS.NOTIFICATIONS, notificationId);
    
    if (notification) {
      // Send push notification
      await sendPushNotification(
        recipientId,
        notification.title,
        notification.message,
        {
          notificationId: notificationId,
          type: type,
          ...data,
        }
      );
    }
    
    return notificationId;
  } catch (error) {
    console.error('Error creating notification with push:', error);
    // Still return notification ID even if push fails
    try {
      return await createNotification(recipientId, type, data);
    } catch (err) {
      throw err;
    }
  }
};

export default {
  createNotification,
  createNotificationWithPush,
  getNotifications,
  markAsRead,
  deleteNotification,
  markAllAsRead,
  registerPushToken,
  getPushToken,
  sendPushNotification,
};





