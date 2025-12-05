import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../config/colors';
import fonts from '../../config/fonts';
import CustomHeader from '../../components/CustomHeader';
import LoadingModal from '../../components/LoadingModal';
import MessagesSvg from '../../assets/messages.svg';
import MessagesDarkSvg from '../../assets/messages-dark.svg';
import NotificationSvg from '../../assets/notification-favorite.svg';
import NotificationDarkSvg from '../../assets/notification-light.svg';
import { getCurrentUser } from '../../services/authService';
import {
  getDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  incrementField,
  COLLECTIONS,
} from '../../services/firestoreService';
import { getUserOnlineStatus } from '../../services/onlineStatusService';
import { timestampToDate } from '../../services/firestoreService';
import { generateUUID } from '../../utils/uuid';
import { serverTimestamp } from 'firebase/firestore';
import SearchSvg from '../../assets/home/Search 1.svg';
import { getCachedConversations, setCachedConversations, getCachedNotifications, setCachedNotifications } from '../../services/storageService';
import { getNotifications } from '../../services/notificationService';
import { subscribeToCollection } from '../../services/firestoreService';

const InboxScreen = ({ navigation, route }) => {
  const [activeTab, setActiveTab] = useState('Message');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [followStatusMap, setFollowStatusMap] = useState({}); // Map of senderId -> isFollowing

  // Helper function to format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = timestampToDate(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      // Format as time if same day, otherwise as date
      const isToday = date.toDateString() === now.toDateString();
      if (isToday) {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      }
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (error) {
      return '';
    }
  };

  // Handle back button press - always navigate to HomeScreen
  const handleBackPress = () => {
    // Always navigate to HomeScreen when back is pressed
    navigation.navigate('Main', { screen: 'Home' });
  };

  // Fetch conversations for current user with caching
  const fetchConversations = async (forceRefresh = false) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        setMessages([]);
        setLoading(false);
        return;
      }

      // Check cache first unless forcing refresh
      if (!forceRefresh) {
        const cachedConversations = await getCachedConversations(currentUser.uid);
        if (cachedConversations) {
          console.log('✅ Using cached conversations:', cachedConversations.length, 'conversations');
          setMessages(cachedConversations);
          setLoading(false);
          // Still fetch in background to update cache
          fetchConversations(true).catch(() => {});
          return;
        }
      }

      setLoading(true);

      // Get all conversations where current user is a participant
      const conversations = await getDocuments(
        COLLECTIONS.CONVERSATIONS,
        [
          { field: 'participants', operator: 'array-contains', value: currentUser.uid },
        ],
        'lastMessageTime',
        'desc'
      );

      // Fetch user data for each conversation's other participant
      const messagesWithUserData = await Promise.all(
        conversations.map(async (conversation) => {
          // Find the other participant (not current user)
          const otherParticipantId = conversation.participants.find(
            (id) => id !== currentUser.uid
          );

          if (!otherParticipantId) {
            return null;
          }

          // Fetch the other user's profile
          let otherUser;
          try {
            otherUser = await getDocument(COLLECTIONS.USERS, otherParticipantId);
          } catch (error) {
            console.error(`Error fetching user profile for ${otherParticipantId}:`, error);
            return null;
          }

          if (!otherUser) {
            return null;
          }

          // Only show unread count if current user is the receiver (not sender)
          // The unreadCount is only incremented for the receiver when messages are sent
          const unreadCount = conversation.unreadCount?.[currentUser.uid] || 0;

          return {
            id: conversation.id,
            conversationId: conversation.id,
            senderId: otherParticipantId,
            senderName: otherUser.displayName || otherUser.name || 'User',
            messagePreview: conversation.lastMessage || 'No messages yet',
            timestamp: formatTimestamp(conversation.lastMessageTime),
            unreadCount: unreadCount, // Only shows count for receiver
            avatar: otherUser.profileImage || otherUser.avatar || null,
            isOnline: await getUserOnlineStatus(otherParticipantId),
          };
        })
      );

      // Filter out null values
      const validMessages = messagesWithUserData.filter((msg) => msg !== null);
      setMessages(validMessages);
      
      // Cache the conversations
      await setCachedConversations(currentUser.uid, validMessages);
      console.log('✅ Fetched and cached conversations:', validMessages.length, 'conversations');
    } catch (error) {
      console.error('Error fetching conversations:', error);
      // On error, try to load from cache as fallback
      const currentUser = getCurrentUser();
      if (currentUser) {
        const cachedConversations = await getCachedConversations(currentUser.uid);
        if (cachedConversations) {
          console.log('⚠️ Using cached conversations due to error');
          setMessages(cachedConversations);
        } else {
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch notifications for current user with caching
  const fetchNotifications = async (forceRefresh = false) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        setNotifications([]);
        setNotificationsLoading(false);
        return;
      }

      // Check cache first unless forcing refresh
      if (!forceRefresh) {
        const cachedNotifications = await getCachedNotifications(currentUser.uid);
        if (cachedNotifications) {
          console.log('✅ Using cached notifications:', cachedNotifications.length, 'notifications');
          setNotifications(cachedNotifications);
          setNotificationsLoading(false);
          // Still fetch in background to update cache
          fetchNotifications(true).catch(() => {});
          return;
        }
      }

      setNotificationsLoading(true);

      // Get all notifications for current user
      const fetchedNotifications = await getNotifications(currentUser.uid);

      // Transform notifications to match UI format
      const transformedNotifications = fetchedNotifications.map((notification) => {
        // Determine section based on timestamp
        let section = 'recent';
        if (notification.createdAt) {
          try {
            const date = timestampToDate(notification.createdAt);
            const now = new Date();
            const diffMs = now - date;
            const diffDays = Math.floor(diffMs / 86400000);
            
            if (diffDays >= 1 && diffDays < 2) {
              section = 'yesterday';
            } else if (diffDays >= 2) {
              section = 'older';
            }
          } catch (error) {
            console.error('Error parsing notification timestamp:', error);
          }
        }

        return {
          id: notification.id,
          type: notification.type,
          senderName: notification.senderName || 'Someone',
          message: notification.message,
          timestamp: formatTimestamp(notification.createdAt),
          section: section,
          avatar: notification.senderAvatar,
          read: notification.read || false,
          data: notification.data || {},
        };
      });

      setNotifications(transformedNotifications);
      
      // Check follow status for follow_request notifications
      const followRequestNotifications = transformedNotifications.filter(
        (n) => n.type === 'follow_request' && n.data?.senderId
      );
      
      if (followRequestNotifications.length > 0) {
        const followStatusPromises = followRequestNotifications.map(async (notification) => {
          const senderId = notification.data.senderId;
          try {
            const follows = await getDocuments(
              COLLECTIONS.FOLLOWS,
              [
                { field: 'followerId', operator: '==', value: currentUser.uid },
                { field: 'followingId', operator: '==', value: senderId },
              ]
            );
            return { senderId, isFollowing: follows.length > 0 };
          } catch (error) {
            console.error(`Error checking follow status for ${senderId}:`, error);
            return { senderId, isFollowing: false };
          }
        });
        
        const followStatuses = await Promise.all(followStatusPromises);
        const statusMap = {};
        followStatuses.forEach(({ senderId, isFollowing }) => {
          statusMap[senderId] = isFollowing;
        });
        setFollowStatusMap(statusMap);
      }
      
      // Cache the notifications
      await setCachedNotifications(currentUser.uid, transformedNotifications);
      console.log('✅ Fetched and cached notifications:', transformedNotifications.length, 'notifications');
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // On error, try to load from cache as fallback
      const currentUser = getCurrentUser();
      if (currentUser) {
        const cachedNotifications = await getCachedNotifications(currentUser.uid);
        if (cachedNotifications) {
          console.log('⚠️ Using cached notifications due to error');
          setNotifications(cachedNotifications);
        } else {
          setNotifications([]);
        }
      } else {
        setNotifications([]);
      }
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Real-time subscription for notifications
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const unsubscribe = subscribeToCollection(
      COLLECTIONS.NOTIFICATIONS,
      async (notifications) => {
        try {
          // Filter notifications for current user
          const userNotifications = notifications.filter(
            (n) => n.recipientId === currentUser.uid
          );

          // Transform notifications
          const transformedNotifications = userNotifications.map((notification) => {
            let section = 'recent';
            if (notification.createdAt) {
              try {
                const date = timestampToDate(notification.createdAt);
                const now = new Date();
                const diffMs = now - date;
                const diffDays = Math.floor(diffMs / 86400000);
                
                if (diffDays >= 1 && diffDays < 2) {
                  section = 'yesterday';
                } else if (diffDays >= 2) {
                  section = 'older';
                }
              } catch (error) {
                console.error('Error parsing notification timestamp:', error);
              }
            }

            return {
              id: notification.id,
              type: notification.type,
              senderName: notification.senderName || 'Someone',
              message: notification.message,
              timestamp: formatTimestamp(notification.createdAt),
              section: section,
              avatar: notification.senderAvatar,
              read: notification.read || false,
              data: notification.data || {},
            };
          });

          setNotifications(transformedNotifications);
          
          // Check follow status for follow_request notifications
          const followRequestNotifications = transformedNotifications.filter(
            (n) => n.type === 'follow_request' && n.data?.senderId
          );
          
          if (followRequestNotifications.length > 0) {
            try {
              const followStatusPromises = followRequestNotifications.map(async (notification) => {
                const senderId = notification.data.senderId;
                try {
                  const follows = await getDocuments(
                    COLLECTIONS.FOLLOWS,
                    [
                      { field: 'followerId', operator: '==', value: currentUser.uid },
                      { field: 'followingId', operator: '==', value: senderId },
                    ]
                  );
                  return { senderId, isFollowing: follows.length > 0 };
                } catch (error) {
                  console.error(`Error checking follow status for ${senderId}:`, error);
                  return { senderId, isFollowing: false };
                }
              });
              
              const followStatuses = await Promise.all(followStatusPromises);
              const statusMap = {};
              followStatuses.forEach(({ senderId, isFollowing }) => {
                statusMap[senderId] = isFollowing;
              });
              setFollowStatusMap(statusMap);
            } catch (error) {
              console.error('Error checking follow statuses:', error);
            }
          }
          
          // Update cache
          setCachedNotifications(currentUser.uid, transformedNotifications).catch(() => {});
        } catch (error) {
          console.error('Error processing notifications in subscription:', error);
        }
      },
      [
        { field: 'recipientId', operator: '==', value: currentUser.uid },
      ],
      'createdAt',
      'desc'
    );

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Use useFocusEffect to refresh conversations and notifications when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      // Refresh conversations when screen is focused
      fetchConversations();
      // Refresh notifications when screen is focused
      fetchNotifications();
      
      // Handle navigation params if user was passed
      const userParam = route?.params?.user;
      if (userParam) {
        handleUserMessage(userParam);
      }
    }, [route?.params?.user])
  );

  // Handle Android hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBackPress();
      return true; // Prevent default back behavior
    });

    return () => backHandler.remove();
  }, []);

  // Helper function to find or create conversation between two users
  const findOrCreateConversation = async (currentUserId, otherUserId) => {
    // Check conversations from current user's perspective
    const conversations1 = await getDocuments(
      COLLECTIONS.CONVERSATIONS,
      [
        { field: 'participants', operator: 'array-contains', value: currentUserId },
      ]
    );

    // Check conversations from other user's perspective (to be thorough)
    const conversations2 = await getDocuments(
      COLLECTIONS.CONVERSATIONS,
      [
        { field: 'participants', operator: 'array-contains', value: otherUserId },
      ]
    );

    // Combine and deduplicate
    const allConversations = [...conversations1, ...conversations2];
    const uniqueConversations = allConversations.filter(
      (conv, index, self) => index === self.findIndex((c) => c.id === conv.id)
    );

    // Find conversation with exactly these two participants
    let conversation = uniqueConversations.find((conv) => {
      if (!conv.participants || conv.participants.length !== 2) return false;
      return (
        conv.participants.includes(currentUserId) &&
        conv.participants.includes(otherUserId)
      );
    });

    // If conversation doesn't exist, create it
    if (!conversation) {
      // Sort participants to ensure consistency
      const participants = [currentUserId, otherUserId].sort();
      
      const conversationId = generateUUID();
      const conversationData = {
        participants: participants,
        lastMessage: null,
        lastMessageTime: serverTimestamp(),
        unreadCount: {
          [currentUserId]: 0,
          [otherUserId]: 0,
        },
      };

      await createDocument(
        COLLECTIONS.CONVERSATIONS,
        conversationData,
        conversationId
      );

      conversation = { id: conversationId, ...conversationData };
    }

    return conversation;
  };

  // Handle message from UserProfileScreen
  const handleUserMessage = async (user) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser || !user) return;

      const otherUserId = user.id || user.userId;
      if (!otherUserId || otherUserId === currentUser.uid) return;

      // Find or create conversation (ensures no duplicates)
      const conversation = await findOrCreateConversation(currentUser.uid, otherUserId);

      // Navigate to MessageDetails with the user data
      navigation.navigate('MessageDetails', {
        message: {
          id: otherUserId,
          senderId: otherUserId,
          conversationId: conversation.id,
          senderName: user.name || user.displayName || 'User',
          avatar: user.avatar || user.profileImage || null,
          isOnline: false,
        },
      });

      // Refresh conversations list
      fetchConversations();
    } catch (error) {
      console.error('Error handling user message:', error);
    }
  };

  const renderMessageItem = ({ item }) => {
    const getImageSource = (source) => {
      if (!source) return require('../../assets/profile.jpg');
      if (typeof source === 'string') return { uri: source };
      return source;
    };

    return (
      <TouchableOpacity
        style={[
          styles.messageItem,
          item.unreadCount > 0 && styles.messageItemUnread,
        ]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('MessageDetails', { message: item })}
      >
        <View style={styles.avatarContainer}>
          <Image source={getImageSource(item.avatar)} style={styles.avatar} />
          {item.isOnline && <View style={styles.onlineIndicator} />}
        </View>
        <View style={styles.messageContent}>
          <View style={styles.messageHeader}>
            <Text style={styles.senderName}>{item.senderName}</Text>
            <Text style={styles.timestamp}>{item.timestamp}</Text>
          </View>
          <View style={styles.messagePreviewRow}>
            <Text
              style={[
                styles.messagePreview,
                item.unreadCount > 0 && styles.messagePreviewUnread,
              ]}
              numberOfLines={1}
            >
              {item.messagePreview}
            </Text>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const handleAccept = async (notificationId, notificationData) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) return;

      const { markAsRead, deleteNotification, createNotification } = await import('../../services/notificationService');
      const { updateDocument, getDocument, COLLECTIONS } = await import('../../services/firestoreService');

      // Mark notification as read
      await markAsRead(notificationId);

      // If it's a battle request, update battle status
      if (notificationData?.battleId) {
        const battle = await getDocument(COLLECTIONS.BATTLES, notificationData.battleId);
        if (battle) {
          // Update battle status to active (battle is now live)
          await updateDocument(COLLECTIONS.BATTLES, notificationData.battleId, {
            status: 'active',
          });

          // Create notification for challenger
          if (battle.player2UserId && battle.player2UserId !== currentUser.uid) {
            await createNotification(battle.player2UserId, 'battle_accepted', {
              senderId: currentUser.uid,
              battleId: notificationData.battleId,
            });
          }

          // Navigate to Battles tab (bottom navigation)
          navigation.navigate('Battles');
        }
      }

      // Refresh notifications
      fetchNotifications(true);
    } catch (error) {
      console.error('Error accepting notification:', error);
      Alert.alert('Error', 'Failed to accept. Please try again.');
    }
  };

  const handleReject = async (notificationId, notificationData) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) return;

      const { markAsRead, deleteNotification, createNotification } = await import('../../services/notificationService');
      const { updateDocument, getDocument, COLLECTIONS } = await import('../../services/firestoreService');

      // Mark notification as read
      await markAsRead(notificationId);

      // If it's a battle request, update battle status
      if (notificationData?.battleId) {
        const battle = await getDocument(COLLECTIONS.BATTLES, notificationData.battleId);
        if (battle) {
          // Update battle status to rejected
          await updateDocument(COLLECTIONS.BATTLES, notificationData.battleId, {
            status: 'rejected',
          });

          // Create notification for challenger
          if (battle.player2UserId && battle.player2UserId !== currentUser.uid) {
            await createNotification(battle.player2UserId, 'battle_rejected', {
              senderId: currentUser.uid,
              battleId: notificationData.battleId,
            });
          }
        }
      }

      // Refresh notifications
      fetchNotifications(true);
    } catch (error) {
      console.error('Error rejecting notification:', error);
      Alert.alert('Error', 'Failed to reject. Please try again.');
    }
  };

  const handleFollowBack = async (notificationId, notificationData) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) return;

      const { markAsRead } = await import('../../services/notificationService');
      const { createDocument, getDocuments, deleteDocument, incrementField, COLLECTIONS } = await import('../../services/firestoreService');
      const { generateUUID } = await import('../../utils/uuid');

      // Get sender ID from notification data
      let senderId = notificationData?.senderId;
      if (!senderId) {
        // Try to get from notification document
        const notification = await getDocument(COLLECTIONS.NOTIFICATIONS, notificationId);
        if (notification && notification.senderId) {
          senderId = notification.senderId;
        }
      }

      if (senderId) {
        // Check if already following
        const existingFollows = await getDocuments(
          COLLECTIONS.FOLLOWS,
          [
            { field: 'followerId', operator: '==', value: currentUser.uid },
            { field: 'followingId', operator: '==', value: senderId },
          ]
        );

        if (existingFollows.length === 0) {
          // Create follow relationship
          const followId = generateUUID();
          await createDocument(
            COLLECTIONS.FOLLOWS,
            {
              followerId: currentUser.uid,
              followingId: senderId,
            },
            followId
          );

          // Increment counts
          await incrementField(COLLECTIONS.USERS, senderId, 'followers', 1);
          await incrementField(COLLECTIONS.USERS, currentUser.uid, 'following', 1);
        }
      }

      // Mark notification as read
      await markAsRead(notificationId);
      
      // Update follow status map
      if (senderId) {
        setFollowStatusMap((prev) => ({
          ...prev,
          [senderId]: true,
        }));
      }

      // Refresh notifications
      fetchNotifications(true);
    } catch (error) {
      console.error('Error following back:', error);
      Alert.alert('Error', 'Failed to follow back. Please try again.');
    }
  };

  const handleNotificationPress = async (item) => {
    // Mark notification as read when clicked
    if (!item.read) {
      try {
        const { markAsRead } = await import('../../services/notificationService');
        await markAsRead(item.id);
        // Update local state
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
        );
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Handle battle_accepted navigation
    if (item.type === 'battle_accepted' && item.data?.battleId) {
      try {
        const { getDocument, COLLECTIONS } = await import('../../services/firestoreService');
        const battle = await getDocument(COLLECTIONS.BATTLES, item.data.battleId);
        if (battle) {
          navigation.navigate('BattleView', { battle: battle });
        }
      } catch (error) {
        console.error('Error navigating to battle:', error);
      }
    }
  };

  const renderNotificationItem = (item) => {
    const getImageSource = (source) => {
      if (!source) return require('../../assets/profile.jpg');
      if (typeof source === 'string') return { uri: source };
      return source;
    };

    // Get first letter of sender name for avatar fallback
    const avatarLetter = item.senderName ? item.senderName.charAt(0).toUpperCase() : '?';
    
    // Check if user is already following for follow_request notifications
    const senderId = item.data?.senderId;
    const isAlreadyFollowing = senderId ? followStatusMap[senderId] : false;

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.notificationCard,
          !item.read && styles.notificationCardUnread
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.notificationAvatar}>
          {item.avatar ? (
            <Image source={getImageSource(item.avatar)} style={styles.notificationAvatarImage} />
          ) : (
            <Text style={styles.notificationAvatarText}>{avatarLetter}</Text>
          )}
        </View>
        <View style={styles.notificationContent}>
          <View style={styles.notificationTextRow}>
            <View style={styles.notificationTextContainer}>
              {!item.read && (
                <View style={styles.unreadDot} />
              )}
              <Text style={[
                styles.notificationText,
                !item.read && styles.notificationTextUnread
              ]}>{item.message}</Text>
            </View>
            {item.timestamp && (
              <Text style={styles.notificationTimestamp}>{item.timestamp}</Text>
            )}
          </View>
          {item.type === 'battle_request' && (
            <View style={styles.notificationActions}>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => handleAccept(item.id, item.data)}
              >
                <Text style={styles.acceptButtonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rejectButton}
                onPress={() => handleReject(item.id, item.data)}
              >
                <Text style={styles.rejectButtonText}>Reject</Text>
              </TouchableOpacity>
            </View>
          )}
          {item.type === 'follow_request' && !isAlreadyFollowing && (
            <TouchableOpacity
              style={styles.followBackButton}
              onPress={() => handleFollowBack(item.id, item.data)}
            >
              <Text style={styles.followBackButtonText}>Follow back</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderNotificationsSection = (sectionTitle, sectionNotifications) => (
    <View key={sectionTitle} style={styles.notificationsSection}>
      <Text style={styles.sectionTitle}>{sectionTitle}</Text>
      {sectionNotifications.map(renderNotificationItem)}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <CustomHeader
        title="Inbox"
        navigation={navigation}
        onBackPress={handleBackPress}
        rightComponent={<View></View>
        //   <TouchableOpacity style={styles.searchButton}>
        //     <SearchSvg width={24} height={24} />
        //   </TouchableOpacity>
        }
      />

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Message' && styles.tabActive]}
          onPress={() => setActiveTab('Message')}
        >
          {activeTab === 'Message' ? (
            <MessagesSvg width={20} height={20} />
          ) : (
            <MessagesDarkSvg width={20} height={20} />
          )}
          <Text
            style={[
              styles.tabText,
              activeTab === 'Message' && styles.tabTextActive,
            ]}
          >
            Message
          </Text>
          {activeTab === 'Message' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'Notifications' && styles.tabActive]}
          onPress={() => setActiveTab('Notifications')}
        >
          {activeTab === 'Notifications' ? (
            <NotificationSvg width={20} height={20} />
          ) : (
            <NotificationDarkSvg width={20} height={20} />
          )}
          <Text
            style={[
              styles.tabText,
              activeTab === 'Notifications' && styles.tabTextActive,
            ]}
          >
            Notifications
          </Text>
          {activeTab === 'Notifications' && (
            <View style={styles.tabIndicator} />
          )}
        </TouchableOpacity>
      </View>

      {/* Messages List or Notifications */}
      {activeTab === 'Message' ? (
        loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.secondary} />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptySubtext}>Start a conversation by messaging a user</Text>
          </View>
        ) : (
          <FlatList
            data={messages}
            renderItem={renderMessageItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )
      ) : notifications.length === 0 && !notificationsLoading ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No notifications yet</Text>
          <Text style={styles.emptySubtext}>You'll see notifications here when someone interacts with you</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.notificationsContent}
          showsVerticalScrollIndicator={false}
        >
          {notifications.filter((n) => n.section === 'recent').length > 0 && renderNotificationsSection(
            'Recent Notifications',
            notifications.filter((n) => n.section === 'recent')
          )}
          {notifications.filter((n) => n.section === 'yesterday').length > 0 && renderNotificationsSection(
            'Yesterday',
            notifications.filter((n) => n.section === 'yesterday')
          )}
          {notifications.filter((n) => n.section === 'older').length > 0 && renderNotificationsSection(
            'Older',
            notifications.filter((n) => n.section === 'older')
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchButton: {
    padding: 4,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    position: "relative",
  },
  tabActive: {
    // Active state styling handled by text/icon colors
  },
  tabText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  tabTextActive: {
    fontFamily: fonts.semiBold,
    color: colors.secondary,
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.secondary,
  },
  listContent: {
    paddingTop: 8,
  },
  messageItem: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.background,
  },
  messageItemUnread: {
    backgroundColor: "#E8F4FD",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.border,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#FFD700",
    borderWidth: 2,
    borderColor: colors.background,
  },
  messageContent: {
    flex: 1,
    justifyContent: "center",
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  senderName: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  timestamp: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  messagePreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  messagePreview: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    marginRight: 8,
  },
  messagePreviewUnread: {
    fontFamily: fonts.medium,
    color: colors.text,
  },
  unreadBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  unreadCount: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    color: colors.textLight,
  },
  notificationsContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  notificationsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 12,
  },
  notificationCard: {
    flexDirection: "row",
    backgroundColor: colors.itemBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: "flex-start",
  },
  notificationAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  notificationAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  notificationAvatarText: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
  },
  notificationCardUnread: {
    backgroundColor: "#E8F4FD",
  },
  notificationTextUnread: {
    fontFamily: fonts.semiBold,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  notificationTextContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: 8,
  },
  notificationText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text,
    lineHeight: 20,
  },
  notificationActions: {
    flexDirection: "row",
  },
  acceptButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.profileCard,
    marginRight: 8,
  },
  acceptButtonText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  rejectButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.light,
  },
  rejectButtonText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  followBackButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.profileCard,
    alignSelf: "flex-start",
  },
  followBackButtonText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  notificationTimestamp: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default InboxScreen;

