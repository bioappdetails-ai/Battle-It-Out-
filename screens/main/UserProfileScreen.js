import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../config/colors';
import fonts from '../../config/fonts';
import CustomHeader from '../../components/CustomHeader';
import VideoModal from '../../components/VideoModal';
import LoadingModal from '../../components/LoadingModal';
import WinRateSvg from '../../assets/win_rate.svg';
import ClashSvg from '../../assets/clash.svg';
import DislikeSvg from '../../assets/Dislike.svg';
import MessageSvg from '../../assets/messageBg.svg';
import { getCurrentUser } from '../../services/authService';
import {
  getDocuments,
  getDocument,
  createDocument,
  deleteDocument,
  incrementField,
  subscribeToCollection,
  COLLECTIONS,
} from '../../services/firestoreService';
import { generateUUID } from '../../utils/uuid';

const UserProfileScreen = ({ route, navigation }) => {
  const { user } = route.params || {};
  const [activeTab, setActiveTab] = useState('Win Battles');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [battlesWon, setBattlesWon] = useState(0);
  const [totalBattles, setTotalBattles] = useState(0);
  const [loading, setLoading] = useState(true);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [videos, setVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  // Default user data
  const userData = user || {
    id: '1',
    username: 'rookie_xt',
    name: 'Jane Cooper',
    profession: 'Video Editor',
    avatar: require('../../assets/profile.jpg'),
    followers: 512,
    following: 500,
    winBattle: '49/50',
  };

  const profileUserId = userData.id || userData.userId;

  // Helper to get image source
  const getImageSource = (source) => {
    if (typeof source === 'string') {
      return { uri: source };
    }
    return source;
  };

  // Fetch videos based on active tab
  const fetchVideos = async () => {
    if (!profileUserId) {
      setVideos([]);
      return;
    }

    try {
      setVideosLoading(true);
      let fetchedVideos = [];

      if (activeTab === 'Win Battles') {
        // Fetch battles where user won
        const battles = await getDocuments(
          COLLECTIONS.BATTLES,
          [
            { field: 'status', operator: '==', value: 'completed' },
            { field: 'winnerId', operator: '==', value: profileUserId },
          ],
          'createdAt',
          'desc',
          20
        );

        fetchedVideos = await Promise.all(
          battles.map(async (battle) => {
            const isPlayer1 = battle.player1UserId === profileUserId;
            const videoId = isPlayer1 ? battle.player1VideoId : battle.player2VideoId;
            const videoUrl = isPlayer1 ? battle.player1VideoUrl : battle.player2VideoUrl;
            const thumbnailUrl = isPlayer1 ? battle.player1ThumbnailUrl : battle.player2ThumbnailUrl;

            // Try to get thumbnail from video document
            let thumbnail = thumbnailUrl;
            if (videoId) {
              try {
                const video = await getDocument(COLLECTIONS.VIDEOS, videoId);
                thumbnail = video?.thumbnailUrl || thumbnail;
              } catch (error) {
                console.error('Error fetching video thumbnail:', error);
              }
            }

            return {
              id: battle.id,
              videoUrl: videoUrl,
              thumbnail: thumbnail || 'https://via.placeholder.com/300x400',
              thumbnailUrl: thumbnail,
              type: 'battle',
            };
          })
        );
      } else if (activeTab === 'Clash') {
        // Fetch all battles where user participated
        // Fetch active battles
        const activeBattles = await getDocuments(
          COLLECTIONS.BATTLES,
          [{ field: 'status', operator: '==', value: 'active' }],
          'createdAt',
          'desc',
          50
        );
        
        // Fetch completed battles
        const completedBattles = await getDocuments(
          COLLECTIONS.BATTLES,
          [{ field: 'status', operator: '==', value: 'completed' }],
          'createdAt',
          'desc',
          50
        );
        
        // Combine and sort
        const battles = [...activeBattles, ...completedBattles].sort(
          (a, b) => {
            const aTime = a.createdAt?.toMillis?.() || 0;
            const bTime = b.createdAt?.toMillis?.() || 0;
            return bTime - aTime;
          }
        );

        // Filter battles where user is a participant
        const userBattles = battles.filter(
          (battle) =>
            battle.player1UserId === profileUserId ||
            battle.player2UserId === profileUserId
        );

        fetchedVideos = await Promise.all(
          userBattles.map(async (battle) => {
            const isPlayer1 = battle.player1UserId === profileUserId;
            const videoId = isPlayer1 ? battle.player1VideoId : battle.player2VideoId;
            const videoUrl = isPlayer1 ? battle.player1VideoUrl : battle.player2VideoUrl;
            const thumbnailUrl = isPlayer1 ? battle.player1ThumbnailUrl : battle.player2ThumbnailUrl;

            let thumbnail = thumbnailUrl;
            if (videoId) {
              try {
                const video = await getDocument(COLLECTIONS.VIDEOS, videoId);
                thumbnail = video?.thumbnailUrl || thumbnail;
              } catch (error) {
                console.error('Error fetching video thumbnail:', error);
              }
            }

            return {
              id: battle.id,
              videoUrl: videoUrl,
              thumbnail: thumbnail || 'https://via.placeholder.com/300x400',
              thumbnailUrl: thumbnail,
              type: 'battle',
            };
          })
        );
      } else if (activeTab === 'Losses') {
        // Fetch completed battles where user participated
        const allCompletedBattles = await getDocuments(
          COLLECTIONS.BATTLES,
          [{ field: 'status', operator: '==', value: 'completed' }],
          'createdAt',
          'desc',
          100
        );

        // Filter battles where user participated but didn't win
        const lostBattles = allCompletedBattles.filter(
          (battle) =>
            (battle.player1UserId === profileUserId ||
              battle.player2UserId === profileUserId) &&
            battle.winnerId &&
            battle.winnerId !== profileUserId
        );

        fetchedVideos = await Promise.all(
          lostBattles.map(async (battle) => {
            const isPlayer1 = battle.player1UserId === profileUserId;
            const videoId = isPlayer1 ? battle.player1VideoId : battle.player2VideoId;
            const videoUrl = isPlayer1 ? battle.player1VideoUrl : battle.player2VideoUrl;
            const thumbnailUrl = isPlayer1 ? battle.player1ThumbnailUrl : battle.player2ThumbnailUrl;

            let thumbnail = thumbnailUrl;
            if (videoId) {
              try {
                const video = await getDocument(COLLECTIONS.VIDEOS, videoId);
                thumbnail = video?.thumbnailUrl || thumbnail;
              } catch (error) {
                console.error('Error fetching video thumbnail:', error);
              }
            }

            return {
              id: battle.id,
              videoUrl: videoUrl,
              thumbnail: thumbnail || 'https://via.placeholder.com/300x400',
              thumbnailUrl: thumbnail,
              type: 'battle',
            };
          })
        );
      }

      setVideos(fetchedVideos);
    } catch (error) {
      console.error('Error fetching videos:', error);
      setVideos([]);
    } finally {
      setVideosLoading(false);
    }
  };

  // Fetch user profile data
  const fetchUserProfile = async () => {
    try {
      if (!profileUserId) {
        setLoading(false);
        return;
      }

      // Fetch user profile from Firestore
      const profileUser = await getDocument(COLLECTIONS.USERS, profileUserId);
      if (profileUser) {
        setFollowersCount(profileUser.followers || 0);
        setFollowingCount(profileUser.following || 0);
        setBattlesWon(profileUser.battlesWon || 0);
        setTotalBattles(profileUser.totalBattles || 0);
      } else {
        // Fallback to default data if user not found
        setFollowersCount(userData.followers || 0);
        setFollowingCount(userData.following || 0);
        setBattlesWon(0);
        setTotalBattles(0);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // Check if current user is following this profile user
  const checkFollowStatus = async () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser || !profileUserId) {
        setLoading(false);
        return;
      }

      // Fetch user profile data
      await fetchUserProfile();

      // Don't show follow button if viewing own profile
      if (currentUser.uid === profileUserId) {
        setIsFollowing(null); // null means don't show follow button
        setLoading(false);
        return;
      }

      // Check if follow relationship exists
      const follows = await getDocuments(
        COLLECTIONS.FOLLOWS,
        [
          { field: 'followerId', operator: '==', value: currentUser.uid },
          { field: 'followingId', operator: '==', value: profileUserId },
        ]
      );

      setIsFollowing(follows.length > 0);
    } catch (error) {
      console.error('Error checking follow status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Follow/Unfollow user
  const handleFollow = async () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser || !profileUserId) {
        Alert.alert('Error', 'Please log in to follow users.');
        return;
      }

      // Don't allow following yourself
      if (currentUser.uid === profileUserId) {
        return;
      }

      setFollowingLoading(true);

      if (isFollowing) {
        // Unfollow: Delete follow relationship
        const follows = await getDocuments(
          COLLECTIONS.FOLLOWS,
          [
            { field: 'followerId', operator: '==', value: currentUser.uid },
            { field: 'followingId', operator: '==', value: profileUserId },
          ]
        );

        if (follows.length > 0) {
          await deleteDocument(COLLECTIONS.FOLLOWS, follows[0].id);
        }

        // Decrement follower count for profile user
        await incrementField(COLLECTIONS.USERS, profileUserId, 'followers', -1);
        
        // Decrement following count for current user
        await incrementField(COLLECTIONS.USERS, currentUser.uid, 'following', -1);

        setIsFollowing(false);
        setFollowersCount((prev) => Math.max(0, prev - 1));
        // Refresh profile data
        await fetchUserProfile();
      } else {
        // Follow: Create follow relationship
        const followId = generateUUID();
        await createDocument(
          COLLECTIONS.FOLLOWS,
          {
            followerId: currentUser.uid,
            followingId: profileUserId,
          },
          followId
        );

        // Increment follower count for profile user
        await incrementField(COLLECTIONS.USERS, profileUserId, 'followers', 1);
        
        // Increment following count for current user
        await incrementField(COLLECTIONS.USERS, currentUser.uid, 'following', 1);

        // Create notification for the followed user
        try {
          const { createNotification } = await import('../../services/notificationService');
          await createNotification(profileUserId, 'follow_request', {
            senderId: currentUser.uid,
          });
        } catch (error) {
          console.error('Error creating follow notification:', error);
          // Don't fail the follow action if notification creation fails
        }

        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
        // Refresh profile data
        await fetchUserProfile();
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
      Alert.alert('Error', 'Failed to update follow status. Please try again.');
    } finally {
      setFollowingLoading(false);
    }
  };

  const handleMessage = () => {
    // Navigate to Inbox screen with user data
    // The Inbox screen will handle creating/finding the conversation
    navigation.navigate('Inbox', {
      user: {
        id: profileUserId,
        userId: profileUserId,
        name: userData.name || userData.displayName,
        displayName: userData.displayName || userData.name,
        avatar: userData.avatar || userData.profileImage,
        profileImage: userData.profileImage || userData.avatar,
      },
    });
  };

  // Check for unread messages with this user
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || !profileUserId || currentUser.uid === profileUserId) {
      setUnreadMessageCount(0);
      return;
    }

    // Subscribe to conversations to check for unread messages
    const unsubscribe = subscribeToCollection(
      COLLECTIONS.CONVERSATIONS,
      (conversations) => {
        try {
          // Find conversation between current user and profile user
          const conversation = conversations.find((conv) => {
            if (!conv.participants || conv.participants.length !== 2) return false;
            return (
              conv.participants.includes(currentUser.uid) &&
              conv.participants.includes(profileUserId)
            );
          });

          if (conversation) {
            const unreadCount = conversation.unreadCount?.[currentUser.uid] || 0;
            setUnreadMessageCount(unreadCount);
          } else {
            setUnreadMessageCount(0);
          }
        } catch (error) {
          console.error('Error checking unread messages:', error);
          setUnreadMessageCount(0);
        }
      },
      [
        { field: 'participants', operator: 'array-contains', value: currentUser.uid },
      ],
      'lastMessageTime',
      'desc'
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [profileUserId]);

  useEffect(() => {
    checkFollowStatus();
  }, [profileUserId]);

  useEffect(() => {
    fetchVideos();
  }, [profileUserId, activeTab]);

  const handleVideoPress = (video) => {
    if (video.videoUrl) {
      setSelectedVideo(video.videoUrl);
      setIsVideoModalVisible(true);
    } else {
      Alert.alert('Error', 'Video URL not available');
    }
  };

  const handleCloseVideoModal = () => {
    setIsVideoModalVisible(false);
    setSelectedVideo(null);
  };

  const renderVideo = ({ item }) => (
    <TouchableOpacity
      style={styles.videoItem}
      onPress={() => handleVideoPress(item)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.thumbnail || item.thumbnailUrl }}
        style={styles.videoThumbnail}
        resizeMode="cover"
      />
      <View style={styles.playOverlay}>
        <Ionicons name="play" size={20} color={colors.textLight} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <CustomHeader title={userData.username || userData.userName || userData.displayName || 'Profile'} navigation={navigation} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card */}
        <View style={styles.profileImageContainerBg}>
          <View style={styles.profileImageContainer}>
            <Image
              source={getImageSource(userData.avatar || userData.profileImage)}
              style={styles.profileImage}
            />
          </View>
        </View>
        <View style={styles.profileCard}>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{userData.name || userData.displayName || 'User'}</Text>
            <Text style={styles.profession}>{userData.profession || ''}</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {loading ? '...' : followersCount}
              </Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {loading ? '...' : followingCount}
              </Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {loading ? '...' : totalBattles > 0 ? `${battlesWon}/${totalBattles}` : '0/0'}
              </Text>
              <Text style={styles.statLabel}>Battles Won</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsRow}>
            {isFollowing !== null && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  isFollowing && styles.actionButtonFollowing,
                ]}
                onPress={handleFollow}
                disabled={followingLoading}
              >
                {followingLoading ? (
                  <ActivityIndicator size="small" color={colors.textLight} />
                ) : (
                  <Text
                    style={[
                      styles.actionButtonText,
                      isFollowing && styles.actionButtonTextFollowing,
                    ]}
                  >
                    {isFollowing ? 'Unfollow' : 'Follow'}
                  </Text>
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.messageButton} onPress={handleMessage}>
              <View style={styles.messageIconContainer}>
                <MessageSvg width={20} height={20} style={{tintColor: colors.textLight}}/>
                {unreadMessageCount > 0 && (
                  <View style={styles.messageBadge}>
                    <Text style={styles.messageBadgeText}>
                      {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Category Tabs */}
        <View style={styles.categoryTabs}>
          <TouchableOpacity
            style={styles.categoryTab}
            onPress={() => setActiveTab('Win Battles')}
          >
            <View
              style={[
                styles.categoryIconContainer,
                activeTab === 'Win Battles'
                  ? styles.categoryIconContainerActive
                  : styles.categoryIconContainerInactive,
              ]}
            >
              <WinRateSvg width={20} height={20} />
            </View>
            <Text
              style={[
                styles.categoryTabText,
                activeTab === 'Win Battles' && styles.categoryTabTextActive,
              ]}
            >
              Win Battles
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.categoryTab}
            onPress={() => setActiveTab('Clash')}
          >
            <View
              style={[
                styles.categoryIconContainer,
                activeTab === 'Clash'
                  ? styles.categoryIconContainerActive
                  : styles.categoryIconContainerInactive,
              ]}
            >
              <ClashSvg width={20} height={20} />
            </View>
            <Text
              style={[
                styles.categoryTabText,
                activeTab === 'Clash' && styles.categoryTabTextActive,
              ]}
            >
              Clash
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.categoryTab}
            onPress={() => setActiveTab('Losses')}
          >
            <View
              style={[
                styles.categoryIconContainer,
                activeTab === 'Losses'
                  ? styles.categoryIconContainerActive
                  : styles.categoryIconContainerInactive,
              ]}
            >
              <DislikeSvg width={20} height={20} />
            </View>
            <Text
              style={[
                styles.categoryTabText,
                activeTab === 'Losses' && styles.categoryTabTextActive,
              ]}
            >
              Losses
            </Text>
          </TouchableOpacity>
        </View>

        {/* Video Grid */}
        {videos.length > 0 ? (
          <FlatList
            data={videos}
            renderItem={renderVideo}
            keyExtractor={(item) => item.id}
            numColumns={3}
            scrollEnabled={false}
            contentContainerStyle={styles.videoGrid}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="videocam-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No videos found</Text>
          </View>
        )}
      </ScrollView>

      {/* Video Modal */}
      <VideoModal
        visible={isVideoModalVisible}
        videoUri={selectedVideo}
        onClose={handleCloseVideoModal}
      />

      {/* Loading Modal */}
      <LoadingModal visible={loading || videosLoading} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  profileCard: {
    backgroundColor: colors.profileCard,
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  profileImage: {
    width: 120,
    height: 120,
    resizeMode: "cover",
    borderRadius: 60,
    backgroundColor: colors.background,
    borderWidth: 4,
    borderColor: colors.secondary,
  },
  profileImageContainer: {
    zIndex: 1000,
    alignItems: "center",
    backgroundColor: colors.background,
    borderWidth: 5,
    borderRadius: 60,
    borderColor: colors.background,
  },
  profileImageContainerBg: {
    alignItems: "center",
    backgroundColor: colors.background,
    borderWidth: 4,
    borderColor: colors.background,
  },
  nameContainer: {
    alignItems: "center",
    marginBottom: 20,
    width: "100%",
  },
  name: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text,
    textAlign: "center",
    marginBottom: 4,
  },
  profession: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingTop: 20,
    paddingBottom: 20,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  actionButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    // paddingHorizontal: 16,
    borderRadius: 8,
    height: 44,

    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  actionButtonFollowing: {
    backgroundColor: colors.itemBackground,
  },
  actionButtonText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.textLight,
  },
  actionButtonTextFollowing: {
    color: colors.text,
  },
  messageButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  messageIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.secondary,
  },
  messageBadgeText: {
    fontSize: 10,
    fontFamily: fonts.semiBold,
    color: colors.textLight,
  },
  categoryTabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 5,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryIconContainerActive: {
    backgroundColor: colors.secondary,
  },
  categoryIconContainerInactive: {
    backgroundColor: "#000000",
  },
  categoryTabText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: "#000000",
    marginLeft: 8,
  },
  categoryTabTextActive: {
    color: colors.secondary,
    fontFamily: fonts.semiBold,
  },
  videoGrid: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  videoItem: {
    flex: 1,
    aspectRatio: 2 / 3,
    overflow: "hidden",
    backgroundColor: colors.border,
    margin: 1,
  },
  videoThumbnail: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  playOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    marginTop: 16,
  },
});

export default UserProfileScreen;

