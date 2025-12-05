import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../config/colors';
import fonts from '../../config/fonts';
import VideoModal from '../../components/VideoModal';
import LoadingModal from '../../components/LoadingModal';
import { getCurrentUser } from '../../services/authService';
import { getDocument, getDocuments, COLLECTIONS } from '../../services/firestoreService';
import {
  getCachedUserProfile,
  setCachedUserProfile,
  getCachedUserVideos,
  setCachedUserVideos,
  getCachedUserBattles,
  setCachedUserBattles,
  getCachedUserSaved,
  setCachedUserSaved,
} from '../../services/storageService';

const ProfileScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('Videos');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userVideos, setUserVideos] = useState([]);
  const [battlesVideos, setBattlesVideos] = useState([]);
  const [savedVideos, setSavedVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [battlesLoading, setBattlesLoading] = useState(false);
  const [savedLoading, setSavedLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);

  // Fetch user videos from Firestore with cache
  const fetchUserVideos = async (forceRefresh = false) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        setUserVideos([]);
        return;
      }

      // Check cache first unless forcing refresh
      if (!forceRefresh) {
        const cachedVideos = await getCachedUserVideos(currentUser.uid);
        if (cachedVideos) {
          console.log('✅ Using cached user videos:', cachedVideos.length);
          setUserVideos(cachedVideos);
          setVideosLoading(false);
          // Still fetch in background to update cache
          fetchUserVideos(true).catch(() => {});
          return;
        }
      }

      setVideosLoading(true);
      const videos = await getDocuments(
        COLLECTIONS.VIDEOS,
        [
          { field: 'userId', operator: '==', value: currentUser.uid },
          { field: 'status', operator: '==', value: 'active' },
        ],
        'createdAt',
        'desc'
      );

      console.log('✅ Fetched user videos from Firestore:', videos.length);
      setUserVideos(videos || []);
      // Cache the videos
      await setCachedUserVideos(currentUser.uid, videos || []);
    } catch (error) {
      console.error('❌ Error fetching user videos:', error);
      setUserVideos([]);
    } finally {
      setVideosLoading(false);
    }
  };

  // Fetch user battles from Firestore with cache
  const fetchUserBattles = async (forceRefresh = false) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        setBattlesVideos([]);
        return;
      }

      // Check cache first unless forcing refresh
      if (!forceRefresh) {
        const cachedBattles = await getCachedUserBattles(currentUser.uid);
        if (cachedBattles) {
          console.log('✅ Using cached battles:', cachedBattles.length);
          setBattlesVideos(cachedBattles);
          setBattlesLoading(false);
          // Still fetch in background to update cache
          fetchUserBattles(true).catch(() => {});
          return;
        }
      }

      setBattlesLoading(true);

      // Fetch battles where current user is player1 or player2
      const player1Battles = await getDocuments(
        COLLECTIONS.BATTLES,
        [{ field: 'player1UserId', operator: '==', value: currentUser.uid }],
        'createdAt',
        'desc'
      );

      const player2Battles = await getDocuments(
        COLLECTIONS.BATTLES,
        [{ field: 'player2UserId', operator: '==', value: currentUser.uid }],
        'createdAt',
        'desc'
      );

      // Combine and deduplicate
      const allBattles = [...player1Battles, ...player2Battles];
      const uniqueBattles = allBattles.filter(
        (battle, index, self) => index === self.findIndex((b) => b.id === battle.id)
      );

      // Filter out pending battles - only show active, completed, or expired battles
      const activeBattles = uniqueBattles.filter(
        (battle) => battle.status !== 'pending'
      );

      // Transform battles to match video grid format
      const transformedBattles = await Promise.all(
        activeBattles.map(async (battle) => {
          const isPlayer1 = battle.player1UserId === currentUser.uid;
          
          // Get thumbnail from video
          let thumbnail = null;
          try {
            const videoId = isPlayer1 ? battle.player1VideoId : battle.player2VideoId;
            if (videoId) {
              const video = await getDocument(COLLECTIONS.VIDEOS, videoId);
              thumbnail = video?.thumbnailUrl;
            }
          } catch (error) {
            console.error('Error fetching video thumbnail:', error);
          }

          // Get opponent info for navigation
          const opponentUserId = isPlayer1 ? battle.player2UserId : battle.player1UserId;
          let opponentUser = null;
          try {
            if (opponentUserId) {
              opponentUser = await getDocument(COLLECTIONS.USERS, opponentUserId);
            }
          } catch (error) {
            console.error('Error fetching opponent user:', error);
          }

          return {
            id: battle.id,
            thumbnail: thumbnail || (isPlayer1 ? battle.player1Thumbnail : battle.player2Thumbnail) || null,
            thumbnailUrl: thumbnail || (isPlayer1 ? battle.player1Thumbnail : battle.player2Thumbnail) || null,
            videoUrl: isPlayer1 ? battle.player1VideoUrl : battle.player2VideoUrl,
            type: 'battle',
            battle: battle, // Store full battle object for navigation
            title: battle.title || battle.category || 'Battle',
            opponentName: opponentUser?.displayName || opponentUser?.userName || 'Opponent',
          };
        })
      );
      
      console.log('✅ Loaded battles:', transformedBattles.length);
      setBattlesVideos(transformedBattles);
      // Cache the battles
      await setCachedUserBattles(currentUser.uid, transformedBattles);
    } catch (error) {
      console.error('❌ Error fetching battles:', error);
      setBattlesVideos([]);
    } finally {
      setBattlesLoading(false);
    }
  };

  // Fetch user saved videos from Firestore with cache
  const fetchUserSaved = async (forceRefresh = false) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        setSavedVideos([]);
        return;
      }

      // Check cache first unless forcing refresh
      if (!forceRefresh) {
        const cachedSaved = await getCachedUserSaved(currentUser.uid);
        if (cachedSaved) {
          console.log('✅ Using cached saved videos:', cachedSaved.length);
          setSavedVideos(cachedSaved);
          setSavedLoading(false);
          // Still fetch in background to update cache
          fetchUserSaved(true).catch(() => {});
          return;
        }
      }

      setSavedLoading(true);
      
      // Fetch saved videos from Firestore
      const savedItems = await getDocuments(
        COLLECTIONS.SAVED_VIDEOS,
        [{ field: 'userId', operator: '==', value: currentUser.uid }],
        'createdAt',
        'desc'
      );

      // Transform saved videos to match video grid format
      const transformedSaved = savedItems.map((item) => ({
        id: item.id,
        thumbnail: item.thumbnailUrl || null,
        thumbnailUrl: item.thumbnailUrl || null,
        videoUrl: item.videoUrl || null,
        type: 'saved',
        title: item.title || 'Saved Video',
        category: item.category || 'General',
        playerName: item.playerName || 'Unknown',
        battleId: item.battleId,
        videoId: item.videoId,
        playerNumber: item.playerNumber,
      }));
      
      console.log('✅ Loaded saved videos:', transformedSaved.length);
      setSavedVideos(transformedSaved);
      // Cache the saved videos
      await setCachedUserSaved(currentUser.uid, transformedSaved);
    } catch (error) {
      console.error('❌ Error fetching saved videos:', error);
      setSavedVideos([]);
    } finally {
      setSavedLoading(false);
    }
  };

  // Get videos based on active tab
  const getVideosForTab = () => {
    switch (activeTab) {
      case 'Videos':
        return userVideos;
      case 'Battles':
        return battlesVideos;
      case 'Saved':
        return savedVideos;
      default:
        return userVideos;
    }
  };

  // Get empty state message based on active tab
  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'Videos':
        return "You don't have any videos";
      case 'Battles':
        return "You don't have any battles";
      case 'Saved':
        return "You don't have any videos saved";
      default:
        return "You don't have any videos";
    }
  };

  const videos = getVideosForTab();

  const fetchUserData = async (forceRefresh = false) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        console.error('No current user found');
        setLoading(false);
        return;
      }

      // Check cache first unless forcing refresh
      if (!forceRefresh) {
        const cachedProfile = await getCachedUserProfile(currentUser.uid);
        if (cachedProfile) {
          console.log('✅ Using cached user profile');
          setUserData(cachedProfile);
          setLoading(false);
          // Still fetch in background to update cache
          fetchUserData(true).catch(() => {});
          return;
        }
      }

      console.log('📝 Fetching user data from Firestore for:', currentUser.uid);
      const profile = await getDocument(COLLECTIONS.USERS, currentUser.uid);
      
      if (profile) {
        console.log('✅ User profile loaded from Firestore:', profile);
        setUserData(profile);
        // Cache the profile
        await setCachedUserProfile(currentUser.uid, profile);
      } else {
        console.warn('⚠️ No profile found for user');
        // If no profile, redirect to profile creation
        navigation.replace('ProfileCreation', {
          userId: currentUser.uid,
          email: currentUser.email,
        });
      }
    } catch (error) {
      console.error('❌ Error fetching user data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Focus listener to refresh data when screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUserData();
      // Load data for current tab
      if (activeTab === 'Videos') {
        fetchUserVideos();
      } else if (activeTab === 'Battles') {
        fetchUserBattles();
      } else if (activeTab === 'Saved') {
        fetchUserSaved();
      }
    });

    // Initial load
    fetchUserData();
    if (activeTab === 'Videos') {
      fetchUserVideos();
    } else if (activeTab === 'Battles') {
      fetchUserBattles();
    } else if (activeTab === 'Saved') {
      fetchUserSaved();
    }

    return unsubscribe;
  }, [navigation]);

  // Fetch data when tab changes
  useEffect(() => {
    if (activeTab === 'Videos') {
      fetchUserVideos();
    } else if (activeTab === 'Battles') {
      fetchUserBattles();
    } else if (activeTab === 'Saved') {
      fetchUserSaved();
    }
  }, [activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    // Force refresh all data
    await fetchUserData(true);
    if (activeTab === 'Videos') {
      await fetchUserVideos(true);
    } else if (activeTab === 'Battles') {
      await fetchUserBattles(true);
    } else if (activeTab === 'Saved') {
      await fetchUserSaved(true);
    }
    setRefreshing(false);
  };

  // Calculate win rate
  const getWinRate = () => {
    if (!userData) return '0/0';
    const total = userData?.totalBattles || 0;
    const won = userData?.battlesWon || 0;
    return `${won}/${total}`;
  };

  // Get profile image source
  const getProfileImageSource = () => {
    if (userData?.profileImage) {
      return { uri: userData.profileImage };
    }
    return require('../../assets/profile.jpg');
  };

  const handleVideoPress = (item) => {
    // Get video URL based on item type
    let videoUrl = null;
    
    if (item.videoUrl) {
      videoUrl = item.videoUrl;
    } else if (item.type === 'battle' && item.battle) {
      // For battles, determine which player's video to show
      const currentUser = getCurrentUser();
      if (currentUser) {
        const isPlayer1 = item.battle.player1UserId === currentUser.uid;
        videoUrl = isPlayer1 ? item.battle.player1VideoUrl : item.battle.player2VideoUrl;
      }
    } else if (item.type === 'saved' && item.videoId) {
      // For saved videos, we might need to fetch the video document
      // But for now, use videoUrl if available
      videoUrl = item.videoUrl;
    } else if (activeTab === 'Videos') {
      // For regular videos, use videoUrl field
      videoUrl = item.videoUrl;
    }

    if (videoUrl) {
      setSelectedVideo(videoUrl);
      setIsVideoModalVisible(true);
    } else {
      Alert.alert('Error', 'Video URL not available');
    }
  };

  const handleCloseVideoModal = () => {
    setIsVideoModalVisible(false);
    setSelectedVideo(null);
  };

  const renderVideo = ({ item }) => {
    // Use thumbnailUrl from Firestore for Videos tab, or thumbnail for other tabs
    const thumbnailUri = item.thumbnailUrl || item.thumbnail;
    
    return (
      <TouchableOpacity
        style={styles.videoItem}
        onPress={() => handleVideoPress(item)}
        activeOpacity={0.8}
      >
        <Image 
          source={
            thumbnailUri 
              ? { uri: thumbnailUri }
              : require('../../assets/profile.jpg')
          } 
          style={styles.videoThumbnail}
          resizeMode="cover"
        />
        <View style={styles.playOverlay}>
          <Ionicons name="play" size={20} color={colors.textLight} />
        </View>
      </TouchableOpacity>
    );
  };

  if (!userData && !loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.errorText}>No profile data found</Text>
      </View>
    );
  }

  // Don't render if userData is null - show loading modal instead
  if (!userData) {
    return (
      <View style={styles.container}>
        <LoadingModal visible={true} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{userData?.userName || userData?.displayName || 'Profile'}</Text>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => {
            try {
              navigation.navigate('Settings');
            } catch (error) {
              console.error('Navigation error:', error);
              const parent = navigation.getParent();
              if (parent) {
                parent.navigate('Settings');
              }
            }
          }}
        >
          <Ionicons name="settings" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* Profile Card */}
        <View style={styles.profileImageContainerBg}>
          <View style={styles.profileImageContainer}>
            <Image
              source={getProfileImageSource()}
              style={styles.profileImage}
            />
          </View>
        </View>
        <View style={styles.profileCard}>
          <View style={styles.nameContainer}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{userData?.displayName || 'User'}</Text>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => navigation.navigate('UpdateProfile')}
              >
                <Ionicons
                  name="pencil-outline"
                  size={16}
                  color={colors.textLight}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.profession}>{userData?.profession || 'No profession'}</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userData?.followers || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userData?.following || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{getWinRate()}</Text>
              <Text style={styles.statLabel}>Win Battle</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setActiveTab("Videos")}
          >
            <View
              style={[
                styles.actionIconContainer,
                activeTab === "Videos"
                  ? styles.actionIconContainerActive
                  : styles.actionIconContainerInactive,
              ]}
            >
              <Ionicons
                name="videocam-outline"
                size={20}
                color={colors.textLight}
              />
            </View>
            <Text
              style={[
                styles.actionButtonText,
                activeTab === "Videos" && styles.actionButtonTextActive,
              ]}
            >
              Videos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setActiveTab("Battles")}
          >
            <View
              style={[
                styles.actionIconContainer,
                activeTab === "Battles"
                  ? styles.actionIconContainerActive
                  : styles.actionIconContainerInactive,
              ]}
            >
              <Ionicons
                name="trophy"
                size={20}
                color={colors.textLight}
              />
            </View>
            <Text
              style={[
                styles.actionButtonText,
                activeTab === "Battles" && styles.actionButtonTextActive,
              ]}
            >
              Battles
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setActiveTab("Saved")}
          >
            <View
              style={[
                styles.actionIconContainer,
                activeTab === "Saved"
                  ? styles.actionIconContainerActive
                  : styles.actionIconContainerInactive,
              ]}
            >
              <Ionicons
                name="bookmark-outline"
                size={20}
                color={colors.textLight}
              />
            </View>
            <Text
              style={[
                styles.actionButtonText,
                activeTab === "Saved" && styles.actionButtonTextActive,
              ]}
            >
              Saved
            </Text>
          </TouchableOpacity>
        </View>

        {/* Video Grid or Empty State */}
        {videos.length > 0 ? (
          <FlatList
            key={activeTab} // Force re-render when tab changes
            data={videos}
            renderItem={renderVideo}
            keyExtractor={(item) => item.id}
            numColumns={3}
            scrollEnabled={false}
            contentContainerStyle={styles.videoGrid}
          />
        ) : (
          <View style={styles.emptyStateContainer}>
            <Ionicons 
              name="videocam-outline" 
              size={64} 
              color={colors.textSecondary} 
            />
            <Text style={styles.emptyStateText}>{getEmptyMessage()}</Text>
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
      <LoadingModal visible={loading || (videosLoading && activeTab === 'Videos') || (battlesLoading && activeTab === 'Battles') || (savedLoading && activeTab === 'Saved')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: colors.text,
    textAlign: "left",
    flex: 1,
    marginLeft: 12,
  },
  settingsButton: {
    padding: 4,
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
    resizeMode: "contain",
    borderRadius: 50,
    // marginBottom: 16,
    backgroundColor: colors.background,
    borderWidth: 4,
    borderColor: colors.secondary,
    borderRadius: 500,
  },
  profileImageContainer: {
    zIndex: 1000,
    alignItems: "center",
    // marginBottom: 16,
    backgroundColor: colors.background,
    borderWidth: 5,
    borderRadius: 500,
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
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    width: "100%",
    position: "relative",
  },
  name: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text,
    textAlign: "center",
  },
  editButton: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    right: 0,
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
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 5,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  actionIconContainerActive: {
    backgroundColor: colors.secondary,
  },
  actionIconContainerInactive: {
    backgroundColor: "#000000",
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: "#000000",
    marginLeft: 8,
  },
  actionButtonTextActive: {
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
    // margin: 2,
    overflow: "hidden",
    backgroundColor: colors.border,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  emptyStateContainer: {
    paddingVertical: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginTop: 16,
    textAlign: 'center',
  },
});

export default ProfileScreen;


