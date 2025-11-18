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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../config/colors';
import fonts from '../../config/fonts';

const MessageDetailsScreen = ({ route, navigation }) => {
  const { message } = route.params || {};
  const scrollViewRef = useRef(null);
  const [inputText, setInputText] = useState('');
  const statusOpacity = useRef(new Animated.Value(1)).current;

  // Default message data
  const contactData = message || {
    id: '1',
    senderName: 'Darlene Steward',
    avatar: 'https://i.pravatar.cc/150?img=1',
    isOnline: true,
  };

  // Sample conversation messages
  const conversationMessages = [
    {
      id: '1',
      text: 'Hey! How are you doing?',
      isSent: false,
      timestamp: '10:30 AM',
    },
    {
      id: '2',
      text: 'I\'m doing great, thanks for asking! How about you?',
      isSent: true,
      timestamp: '10:32 AM',
    },
    {
      id: '3',
      text: 'Pls take a look at the images.',
      isSent: false,
      timestamp: '10:35 AM',
    },
    {
      id: '4',
      text: 'Sure, let me check them out.',
      isSent: true,
      timestamp: '10:36 AM',
    },
    {
      id: '5',
      text: 'What do you think?',
      isSent: false,
      timestamp: '10:40 AM',
    },
    {
      id: '6',
      text: 'They look amazing! Great work!',
      isSent: true,
      timestamp: '10:42 AM',
    },
  ];

  useEffect(() => {
    // Scroll to bottom when component mounts
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: false });
    }, 100);

    // Animate status appear and disappear
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

  const handleSend = () => {
    if (inputText.trim()) {
      // Handle send message logic here
      console.log('Sending message:', inputText);
      setInputText('');
      // Scroll to bottom after sending
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const renderMessage = (msg) => (
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
        <Text
          style={[
            styles.messageTime,
            msg.isSent ? styles.sentMessageTime : styles.receivedMessageTime,
          ]}
        >
          {msg.timestamp}
        </Text>
      </View>
    </View>
  );

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
              source={{ uri: contactData.avatar }}
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
      >
        {conversationMessages.map(renderMessage)}
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
              !inputText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() ? colors.textLight : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  messageTime: {
    fontSize: 11,
    fontFamily: fonts.regular,
    alignSelf: 'flex-end',
  },
  sentMessageTime: {
    color: 'rgba(28, 23, 23, 0.91)',
  },
  receivedMessageTime: {
    color: colors.textSecondary,
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
});

export default MessageDetailsScreen;

