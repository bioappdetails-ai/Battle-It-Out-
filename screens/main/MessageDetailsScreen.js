import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../config/colors';
import fonts from '../../config/fonts';
import LoadingModal from '../../components/LoadingModal';
import { getCurrentUser } from '../../services/authService';
import {
  getDocuments,
  getDocument,
  createDocument,
  updateDocument,
  subscribeToCollection,
  subscribeToDocument,
  COLLECTIONS,
  timestampToDate,
} from '../../services/firestoreService';
import { generateUUID } from '../../utils/uuid';
import { serverTimestamp, increment } from 'firebase/firestore';

const MessageDetailsScreen = ({ route, navigation }) => {
  const { message } = route.params || {};
  const scrollViewRef = useRef(null);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const statusOpacity = useRef(new Animated.Value(1)).current;
  const typingTimeoutRef = useRef(null);
  const conversationIdRef = useRef(null);
  const otherUserIdRef = useRef(null);
  const typingAnimationRef = useRef(null);
  const unsubscribeMessagesRef = useRef(null);

  // Get contact data from route params
  const contactData = message || {
    id: '1',
    senderName: 'Darlene Steward',
    avatar: 'https://i.pravatar.cc/150?img=1',
    isOnline: true,
  };

  const otherUserId = contactData.senderId || contactData.id;
  const conversationId = contactData.conversationId;

  // Debug logging
  useEffect(() => {
    console.log('MessageDetailsScreen - Route params:', route.params);
    console.log('MessageDetailsScreen - Contact data:', contactData);
    console.log('MessageDetailsScreen - ConversationId:', conversationId);
    console.log('MessageDetailsScreen - OtherUserId:', otherUserId);
  }, []);

  // Format timestamp helper
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = timestampToDate(timestamp);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      
      if (isToday) {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      }
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (error) {
      return '';
    }
  };

  // Fetch messages and set up real-time listener
  useEffect(() => {
    if (!conversationId) {
      console.warn('No conversationId provided, cannot fetch messages');
      setMessages([]);
      setLoading(false);
      return;
    }

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const currentUser = getCurrentUser();
        if (!currentUser) {
          console.warn('No current user, cannot fetch messages');
          setMessages([]);
          setLoading(false);
          return;
        }

        conversationIdRef.current = conversationId;
        otherUserIdRef.current = otherUserId;

        console.log('Fetching messages for conversationId:', conversationId);

        // Subscribe to real-time messages
        const unsubscribe = subscribeToCollection(
          COLLECTIONS.MESSAGES,
          async (messagesData) => {
            console.log('Received messages data:', messagesData.length, 'messages');
            const conversationMessages = messagesData
              .filter((msg) => msg.conversationId === conversationId)
              .map((msg) => ({
                id: msg.id,
                text: msg.text,
                senderId: msg.senderId,
                receiverId: msg.receiverId,
                status: msg.status || 'sent', // sent, delivered, read
                isSent: msg.senderId === currentUser.uid,
                timestamp: formatTimestamp(msg.createdAt),
                createdAt: msg.createdAt,
              }))
              .sort((a, b) => {
                // Sort by timestamp
                if (!a.createdAt || !b.createdAt) return 0;
                const aTime = a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
                const bTime = b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
                return aTime - bTime;
              });

            console.log('Filtered conversation messages:', conversationMessages.length);
            setMessages(conversationMessages);
            setLoading(false);

            // Mark received messages as delivered/read when receiver views conversation
            // Only mark messages where current user is the receiver and status is not already read
            const unreadReceivedMessages = conversationMessages.filter(
              (msg) => msg.receiverId === currentUser.uid && msg.status !== 'read'
            );

            if (unreadReceivedMessages.length > 0) {
              // Mark all unread messages as delivered immediately
              const updatePromises = unreadReceivedMessages.map(async (msg) => {
                try {
                  // Update message status to delivered if it's still 'sent'
                  if (msg.status === 'sent') {
                    await updateDocument(COLLECTIONS.MESSAGES, msg.id, {
                      status: 'delivered',
                    });
                  }
                  
                  // After a short delay, mark as read (simulating user reading the message)
                  setTimeout(async () => {
                    try {
                      await updateDocument(COLLECTIONS.MESSAGES, msg.id, {
                        status: 'read',
                      });
                    } catch (error) {
                      console.error('Error marking message as read:', error);
                    }
                  }, 1000); // 1 second delay to show delivered state
                } catch (error) {
                  console.error('Error updating message status to delivered:', error);
                }
              });

              // Wait for all delivered updates to complete
              await Promise.all(updatePromises);

              // Clear unread count for current user (receiver)
              try {
                await updateDocument(COLLECTIONS.CONVERSATIONS, conversationId, {
                  [`unreadCount.${currentUser.uid}`]: 0,
                });
              } catch (error) {
                console.error('Error clearing unread count:', error);
              }
            }

            // Scroll to bottom when new messages arrive
            setTimeout(() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
          },
          [
            { field: 'conversationId', operator: '==', value: conversationId },
          ],
          'createdAt',
          'asc'
        );

        return unsubscribe;
      } catch (error) {
        console.error('Error fetching messages:', error);
        setMessages([]);
        setLoading(false);
      }
    };

    const unsubscribe = fetchMessages();
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
      unsubscribeMessagesRef.current = null;
    };
  }, [conversationId]);

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    if (!conversationId || refreshing) return;

    try {
      setRefreshing(true);
      const currentUser = getCurrentUser();
      if (!currentUser) {
        setRefreshing(false);
        return;
      }

      // Force refresh by re-subscribing to messages
      // The real-time listener will automatically update the messages
      // We just need to trigger a refresh state
      
      // Small delay to show refresh indicator
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // The real-time listener will handle the actual data refresh
      setRefreshing(false);
    } catch (error) {
      console.error('Error refreshing messages:', error);
      setRefreshing(false);
    }
  };

  // Subscribe to typing status
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = subscribeToDocument(
      COLLECTIONS.CONVERSATIONS,
      conversationId,
      (conversation) => {
        if (conversation && conversation.typing) {
          const currentUser = getCurrentUser();
          if (currentUser && otherUserId) {
            // Check if other user is typing
            const otherUserTypingStatus = conversation.typing[otherUserId];
            setOtherUserTyping(otherUserTypingStatus === true);
          }
        } else {
          setOtherUserTyping(false);
        }
      }
    );

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [conversationId, otherUserId]);

  // Handle typing indicator
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || !conversationId) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (inputText.trim().length > 0) {
      // Set typing status
      setIsTyping(true);
      updateDocument(COLLECTIONS.CONVERSATIONS, conversationId, {
        [`typing.${currentUser.uid}`]: true,
      });

      // Clear typing status after 3 seconds of no typing
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        updateDocument(COLLECTIONS.CONVERSATIONS, conversationId, {
          [`typing.${currentUser.uid}`]: false,
        });
      }, 3000);
    } else {
      // Clear typing status immediately if input is empty
      setIsTyping(false);
      updateDocument(COLLECTIONS.CONVERSATIONS, conversationId, {
        [`typing.${currentUser.uid}`]: false,
      });
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [inputText, conversationId]);

  // Animate status appear and disappear
  useEffect(() => {
    const statusAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(statusOpacity, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(statusOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    statusAnimation.start();

    // Cleanup on unmount
    return () => {
      statusAnimation.stop();
    };
  }, [statusOpacity]);

  // Cleanup typing status on unmount
  useEffect(() => {
    return () => {
      const currentUser = getCurrentUser();
      if (currentUser && conversationIdRef.current) {
        updateDocument(COLLECTIONS.CONVERSATIONS, conversationIdRef.current, {
          [`typing.${currentUser.uid}`]: false,
        });
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleSend = async () => {
    if (!inputText.trim() || sending || !conversationId) return;

    const messageText = inputText.trim();
    setInputText(''); // Clear input immediately for better UX

    try {
      setSending(true);
      const currentUser = getCurrentUser();
      if (!currentUser) {
        setInputText(messageText); // Restore on error
        return;
      }

      // Clear typing status
      setIsTyping(false);
      await updateDocument(COLLECTIONS.CONVERSATIONS, conversationId, {
        [`typing.${currentUser.uid}`]: false,
      });

      // Create message document with status
      const messageId = generateUUID();
      await createDocument(
        COLLECTIONS.MESSAGES,
        {
          conversationId: conversationId,
          senderId: currentUser.uid,
          receiverId: otherUserId,
          text: messageText,
          status: 'sent', // sent, delivered, read
        },
        messageId
      );

      // Update conversation with last message
      // Only increment unreadCount for the receiver (not sender)
      await updateDocument(COLLECTIONS.CONVERSATIONS, conversationId, {
        lastMessage: messageText,
        lastMessageTime: serverTimestamp(),
        [`unreadCount.${otherUserId}`]: increment(1),
      });

      // Scroll to bottom after sending
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore input text on error
      setInputText(messageText);
    } finally {
      setSending(false);
    }
  };

  // Typing indicator component
  const TypingIndicator = React.memo(() => {
    const dot1 = useRef(new Animated.Value(0.3)).current;
    const dot2 = useRef(new Animated.Value(0.3)).current;
    const dot3 = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
      const animateDot = (dot, delay) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(dot, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0.3,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const anim1 = animateDot(dot1, 0);
      const anim2 = animateDot(dot2, 200);
      const anim3 = animateDot(dot3, 400);

      anim1.start();
      anim2.start();
      anim3.start();

      return () => {
        anim1.stop();
        anim2.stop();
        anim3.stop();
      };
    }, []);

    return (
      <View style={styles.typingIndicatorContainer}>
        <View style={styles.typingBubble}>
          <Animated.View style={[styles.typingDot, { opacity: dot1 }]} />
          <Animated.View style={[styles.typingDot, { opacity: dot2 }]} />
          <Animated.View style={[styles.typingDot, { opacity: dot3 }]} />
        </View>
      </View>
    );
  });

  const renderMessage = (msg) => {
    // Get read receipt icon based on status (only for sent messages)
    const getReadReceiptIcon = () => {
      if (!msg.isSent) return null;
      
      if (msg.status === 'read') {
        // Two ticks, primary color (read)
        return (
          <View style={styles.readReceiptContainer}>
            <Ionicons name="checkmark-done" size={14} color={colors.primary} />
          </View>
        );
      } else if (msg.status === 'delivered') {
        // Two ticks, secondary color (delivered)
        return (
          <View style={styles.readReceiptContainer}>
            <Ionicons name="checkmark-done" size={14} color={colors.secondary} />
          </View>
        );
      } else {
        // One tick, secondary color (sent)
        return (
          <View style={styles.readReceiptContainer}>
            <Ionicons name="checkmark" size={14} color={colors.secondary} />
          </View>
        );
      }
    };

    return (
      <View
        key={msg.id}
        style={[
          styles.messageContainer,
          msg.isSent ? styles.sentMessage : styles.receivedMessage,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            msg.isSent ? styles.sentBubble : styles.receivedBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              msg.isSent ? styles.sentMessageText : styles.receivedMessageText,
            ]}
          >
            {msg.text}
          </Text>
          <View style={styles.messageFooter}>
            <Text
              style={[
                styles.messageTime,
                msg.isSent ? styles.sentMessageTime : styles.receivedMessageTime,
              ]}
            >
              {msg.timestamp}
            </Text>
            {getReadReceiptIcon()}
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.headerCenter}
          onPress={() =>
            navigation.navigate('UserProfile', {
              user: {
                username: contactData.senderName.toLowerCase().replace(' ', '_'),
                name: contactData.senderName,
                profession: 'Content Creator',
                avatar: contactData.avatar || 'https://i.pravatar.cc/150?img=1',
                followers: 512,
                following: 500,
                winBattle: '49/50',
              },
            })
          }
        >
          <View style={styles.headerAvatarContainer}>
            <Image
              source={
                contactData.avatar
                  ? typeof contactData.avatar === 'string'
                    ? { uri: contactData.avatar }
                    : contactData.avatar
                  : require('../../assets/profile.jpg')
              }
              style={styles.headerAvatar}
            />
            {contactData.isOnline && (
              <View style={styles.onlineIndicator} />
            )}
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerName}>{contactData.senderName}</Text>
            <Animated.Text
              style={[
                styles.headerStatus,
                { opacity: statusOpacity },
              ]}
            >
              {contactData.isOnline ? 'Online' : 'Offline'}
            </Animated.Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-vertical" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {messages.length === 0 && !loading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Start the conversation by sending a message</Text>
          </View>
        ) : (
          <>
            {messages.map(renderMessage)}
            {otherUserTyping && <TypingIndicator />}
          </>
        )}
      </ScrollView>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={colors.placeholder}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={colors.textLight} />
            ) : (
              <Ionicons
                name="send"
                size={20}
                color={inputText.trim() ? colors.textLight : colors.textSecondary}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading Modal */}
      <LoadingModal visible={loading} />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginLeft: 12,
  },
  headerAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: colors.background,
  },
  headerTextContainer: {
    alignItems: 'flex-start',
  },
  headerName: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.secondary,
  },
  headerStatus: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.placeholder,
  },
  menuButton: {
    padding: 4,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 12,
    flexDirection: 'row',
  },
  sentMessage: {
    justifyContent: 'flex-end',
  },
  receivedMessage: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  sentBubble: {
    backgroundColor: colors.profileCard,
    borderBottomRightRadius: 4,
  },
  receivedBubble: {
    backgroundColor: colors.itemBackground,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    lineHeight: 20,
    marginBottom: 4,
  },
  sentMessageText: {
    color: colors.text,
  },
  receivedMessageText: {
    color: colors.text,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
    fontFamily: fonts.regular,
  },
  sentMessageTime: {
    color: 'rgba(28, 23, 23, 0.91)',
    marginRight: 4,
  },
  receivedMessageTime: {
    color: colors.textSecondary,
  },
  readReceiptContainer: {
    marginLeft: 2,
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.itemBackground,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text,
    maxHeight: 100,
    paddingVertical: 4,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  typingIndicatorContainer: {
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  typingBubble: {
    backgroundColor: colors.itemBackground,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginHorizontal: 3,
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
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default MessageDetailsScreen;

