import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../config/colors';
import fonts from '../../config/fonts';
import CustomHeader from '../../components/CustomHeader';
import MessagesSvg from '../../assets/messages.svg';
import MessagesDarkSvg from '../../assets/messages-dark.svg';
import NotificationSvg from '../../assets/notification-favorite.svg';
import NotificationDarkSvg from '../../assets/notification-light.svg';
import SearchSvg from '../../assets/home/Search 1.svg';

const InboxScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('Message');

  // Sample notification data
  const notifications = [
    {
      id: '1',
      type: 'battle_request',
      senderName: 'Saim_ali',
      message: 'Saim_ali sent you Battel request',
      timestamp: '5m ago',
      section: 'recent',
      avatar: 'S',
    },
    {
      id: '2',
      type: 'follow_request',
      senderName: 'Saim_ali',
      message: 'Saim_ali sent you follow request',
      timestamp: null,
      section: 'recent',
      avatar: 'S',
    },
    {
      id: '3',
      type: 'follow_request',
      senderName: 'Saim_ali',
      message: 'Saim_ali sent you follow request',
      timestamp: null,
      section: 'yesterday',
      avatar: 'S',
    },
    {
      id: '4',
      type: 'battle_expired',
      senderName: 'Saim_ali',
      message: 'Saim_ali battle request is expired',
      timestamp: '1 day ago',
      section: 'yesterday',
      avatar: 'S',
    },
  ];

  // Sample message data
  const messages = [
    {
      id: '1',
      senderName: 'Darlene Steward',
      messagePreview: 'Pls take a look at the images.',
      timestamp: '18.31',
      unreadCount: 5,
      avatar: 'https://i.pravatar.cc/150?img=1',
      isOnline: true,
    },
    {
      id: '2',
      senderName: 'Darlene Steward',
      messagePreview: 'Pls take a look at the images.',
      timestamp: '18.31',
      unreadCount: 0,
      avatar: 'https://i.pravatar.cc/150?img=1',
      isOnline: false,
    },
    {
      id: '3',
      senderName: 'Darlene Steward',
      messagePreview: 'Pls take a look at the images.',
      timestamp: '18.31',
      unreadCount: 0,
      avatar: 'https://i.pravatar.cc/150?img=1',
      isOnline: false,
    },
    {
      id: '4',
      senderName: 'Darlene Steward',
      messagePreview: 'Pls take a look at the images.',
      timestamp: '18.31',
      unreadCount: 0,
      avatar: 'https://i.pravatar.cc/150?img=1',
      isOnline: false,
    },
    {
      id: '5',
      senderName: 'Darlene Steward',
      messagePreview: 'Pls take a look at the images.',
      timestamp: '18.31',
      unreadCount: 0,
      avatar: 'https://i.pravatar.cc/150?img=1',
      isOnline: false,
    },
    {
      id: '6',
      senderName: 'Darlene Steward',
      messagePreview: 'Pls take a look at the images.',
      timestamp: '18.31',
      unreadCount: 0,
      avatar: 'https://i.pravatar.cc/150?img=1',
      isOnline: false,
    },
    {
      id: '7',
      senderName: 'Darlene Steward',
      messagePreview: 'Pls take a look at the images.',
      timestamp: '18.31',
      unreadCount: 0,
      avatar: 'https://i.pravatar.cc/150?img=1',
      isOnline: false,
    },
    {
      id: '8',
      senderName: 'Darlene Steward',
      messagePreview: 'Pls take a look at the images.',
      timestamp: '18.31',
      unreadCount: 0,
      avatar: 'https://i.pravatar.cc/150?img=1',
      isOnline: false,
    },
  ];

  const renderMessageItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.messageItem,
        item.unreadCount > 0 && styles.messageItemUnread,
      ]}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('MessageDetails', { message: item })}
    >
      <View style={styles.avatarContainer}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
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

  const handleAccept = (notificationId) => {
    console.log('Accept notification:', notificationId);
    // Handle accept logic
  };

  const handleReject = (notificationId) => {
    console.log('Reject notification:', notificationId);
    // Handle reject logic
  };

  const handleFollowBack = (notificationId) => {
    console.log('Follow back notification:', notificationId);
    // Handle follow back logic
  };

  const renderNotificationItem = (item) => (
    <View key={item.id} style={styles.notificationCard}>
      <View style={styles.notificationAvatar}>
        <Text style={styles.notificationAvatarText}>{item.avatar}</Text>
      </View>
      <View style={styles.notificationContent}>
        <View style={styles.notificationTextRow}>
          <Text style={styles.notificationText}>{item.message}</Text>
          {item.timestamp && (
            <Text style={styles.notificationTimestamp}>{item.timestamp}</Text>
          )}
        </View>
        {item.type === 'battle_request' && (
          <View style={styles.notificationActions}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => handleAccept(item.id)}
            >
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => handleReject(item.id)}
            >
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
        {item.type === 'follow_request' && (
          <TouchableOpacity
            style={styles.followBackButton}
            onPress={() => handleFollowBack(item.id)}
          >
            <Text style={styles.followBackButtonText}>Follow back</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

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
        <FlatList
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.notificationsContent}
          showsVerticalScrollIndicator={false}
        >
          {renderNotificationsSection(
            'Recent Notifications',
            notifications.filter((n) => n.section === 'recent')
          )}
          {renderNotificationsSection(
            'Yesterday',
            notifications.filter((n) => n.section === 'yesterday')
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
  },
  notificationAvatarText: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
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
  notificationText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text,
    lineHeight: 20,
    marginRight: 8,
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
});

export default InboxScreen;

