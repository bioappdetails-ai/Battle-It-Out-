import { getCurrentUser } from './authService';
import { createDocument, getDocuments, updateDocument, deleteDocument, COLLECTIONS, serverTimestamp } from './firestoreService';
import { generateUUID } from '../utils/uuid';
import { getDocument } from './firestoreService';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const createNotification = async (recipientId, type, data = {}) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User must be logged in to create notifications');
    }

    const senderId = data.senderId || currentUser.uid;
    
    let senderProfile = null;
    try {
      senderProfile = await getDocument(COLLECTIONS.USERS, senderId);
    } catch (error) {
    }

    const senderName = senderProfile?.displayName || senderProfile?.userName || senderProfile?.name || 'Someone';
    const senderAvatar = senderProfile?.profileImage || senderProfile?.avatar || null;

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
    
    sendPushNotification(recipientId, title, message, {
      notificationId: notificationId,
      type: type,
      ...data,
    }).catch((error) => {
    });
    
    return notificationId;
  } catch (error) {
    throw error;
  }
};

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
    throw error;
  }
};

export const markAsRead = async (notificationId) => {
  try {
    await updateDocument(COLLECTIONS.NOTIFICATIONS, notificationId, {
      read: true,
    });
  } catch (error) {
    throw error;
  }
};

export const deleteNotification = async (notificationId) => {
  try {
    await deleteDocument(COLLECTIONS.NOTIFICATIONS, notificationId);
  } catch (error) {
    throw error;
  }
};

export const markAllAsRead = async (userId) => {
  try {
    const notifications = await getNotifications(userId);
    const unreadNotifications = notifications.filter(n => !n.read);

    await Promise.all(
      unreadNotifications.map(notification => 
        updateDocument(COLLECTIONS.NOTIFICATIONS, notification.id, {
          read: true,
        })
      )
    );
  } catch (error) {
    throw error;
  }
};
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const registerPushToken = async (userId) => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'ab9fb6f4-804a-48b8-957d-c6b77c970b55',
    });

    const pushToken = tokenData.data;

    await updateDocument(COLLECTIONS.USERS, userId, {
      pushToken: pushToken,
      pushTokenUpdatedAt: serverTimestamp(),
    });

    return pushToken;
  } catch (error) {
    return null;
  }
};

export const getPushToken = async (userId) => {
  try {
    const user = await getDocument(COLLECTIONS.USERS, userId);
    return user?.pushToken || null;
  } catch (error) {
    return null;
  }
};

export const sendPushNotification = async (recipientId, title, body, data = {}) => {
  try {
    const pushToken = await getPushToken(recipientId);
    
    if (!pushToken) {
      return false;
    }

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
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};

export const createNotificationWithPush = async (recipientId, type, data = {}) => {
  try {
    const notificationId = await createNotification(recipientId, type, data);
    const notification = await getDocument(COLLECTIONS.NOTIFICATIONS, notificationId);
    
    if (notification) {
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





