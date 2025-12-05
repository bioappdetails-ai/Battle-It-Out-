import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, FlatList, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Video from 'react-native-video';
import colors from '../../config/colors';
import fonts from '../../config/fonts';
import HeaderSvg from '../../assets/home/Header.svg';
import SearchSvg from '../../assets/home/Search 1.svg';
import MessageSvg from '../../assets/home/Message 22.svg';
import { getDocuments, getDocument, COLLECTIONS, subscribeToDocument, subscribeToCollection } from '../../services/firestoreService';
import { timestampToDate } from '../../services/firestoreService';
import { getCachedData, setCachedData } from '../../services/storageService';
import { trackViewWithDuration } from '../../services/viewService';
import LoadingModal from "../../components/LoadingModal";
import ReportModal from '../../components/ReportModal';
import { getCurrentUser } from '../../services/authService';
import { reportVideo, getUserReports } from '../../services/reportService';


const { height: screenHeight } = Dimensions.get('window');

const HOME_FEED_CACHE_KEY = '@battleitout:home_feed';

const HomeScreen = ({ navigation }) => {
  const [feedData, setFeedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentVisibleIndex, setCurrentVisibleIndex] = useState(null);
  const [pausedVideos, setPausedVideos] = useState(new Set());
  const [mutedVideos, setMutedVideos] = useState(new Set());
  const [visibleControls, setVisibleControls] = useState(new Set());
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingVideo, setReportingVideo] = useState(null);
  const [reportedVideoIds, setReportedVideoIds] = useState(new Set());
  const videoRefs = useRef({});
  const controlTimers = useRef({});
  const viewTrackingTimers = useRef({}); // Track view timers for each video
  const videoPlayStartTimes = useRef({}); // Track when videos started playing
  const viewRecorded = useRef(new Set()); // Track which videos have already recorded views

  // Calculate time ago from timestamp
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    const date = timestampToDate(timestamp);
    if (!date) return 'Just now';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    return `${Math.floor(diffInSeconds / 604800)}w`;
  };

  // Format duration from seconds to MM:SS
  const formatDuration = (seconds) => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format views count
  const formatViews = (count) => {
    if (!count) return '0';
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`.replace('.0', '');
    return `${(count / 1000000).toFixed(1)}M`.replace('.0', '');
  };

  // Fetch latest videos from Firestore with caching
  const fetchLatestVideos = async (forceRefresh = false) => {
    try {
      // Check cache first unless forcing refresh
      if (!forceRefresh) {
        const cachedFeed = await getCachedData(HOME_FEED_CACHE_KEY);
        if (cachedFeed) {
          console.log('✅ Using cached home feed:', cachedFeed.length, 'videos');
          setFeedData(cachedFeed);
          setLoading(false);
          // Still fetch in background to update cache
          fetchLatestVideos(true).catch(() => {});
          return;
        }
      }

      setLoading(true);
      
      // Fetch latest 20 videos ordered by createdAt desc
      const videos = await getDocuments(
        COLLECTIONS.VIDEOS,
        [{ field: 'status', operator: '==', value: 'active' }],
        'createdAt',
        'desc',
        20
      );

      console.log('✅ Fetched videos from Firestore for home feed:', videos.length);

      // Transform videos to match feed data structure
      const transformedVideos = await Promise.all(
        videos.map(async (video) => {
          // Fetch user profile for each video
          let userProfile = null;
          try {
            userProfile = await getDocument(COLLECTIONS.USERS, video.userId);
          } catch (error) {
            console.error(`Error fetching user profile for ${video.userId}:`, error);
          }

          return {
            id: video.id,
            username: userProfile?.userName || userProfile?.displayName || video.userName || 'Unknown',
            profileImage: userProfile?.profileImage 
              ? { uri: userProfile.profileImage } 
              : require('../../assets/profile.jpg'),
            isVerified: userProfile?.isVerified || userProfile?.verified || false,
            timeAgo: getTimeAgo(video.createdAt),
            videoThumbnail: video.thumbnailUrl 
              ? { uri: video.thumbnailUrl } 
              : require('../../assets/profile.jpg'),
            videoUrl: video.videoUrl,
            videoDuration: formatDuration(video.duration),
            views: formatViews(video.views || 0),
            caption: video.title || '',
            description: video.description || '',
            hasTranslation: false, // TODO: Implement translation feature
            video: video, // Store full video object for navigation
            user: userProfile, // Store user profile for navigation
          };
        })
      );

      // Filter out reported videos
      const currentUser = getCurrentUser();
      let filteredVideos = transformedVideos;
      if (currentUser && reportedVideoIds.size > 0) {
        filteredVideos = transformedVideos.filter((item) => {
          const videoId = item.video?.id || item.id;
          return !reportedVideoIds.has(videoId);
        });
      }
      
      setFeedData(filteredVideos);
      // Cache the feed
      await setCachedData(HOME_FEED_CACHE_KEY, filteredVideos);
    } catch (error) {
      console.error('❌ Error fetching latest videos:', error);
      setFeedData([]);
    } finally {
      setLoading(false);
    }
  };

  // Check for unread notifications
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      setHasUnreadNotifications(false);
      return;
    }

    // Subscribe to notifications for real-time updates
    const unsubscribe = subscribeToCollection(
      COLLECTIONS.NOTIFICATIONS,
      (notifications) => {
        try {
          // Check if there are any unread notifications
          // whereConditions already filters by recipientId, so all notifications are for current user
          const hasUnread = notifications.some((notification) => !notification.read);
          setHasUnreadNotifications(hasUnread);
        } catch (error) {
          console.error('Error processing notifications:', error);
          setHasUnreadNotifications(false);
        }
      },
      [
        { field: 'recipientId', operator: '==', value: currentUser.uid },
      ],
      'createdAt',
      'desc'
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Fetch reported video IDs to filter them out
  useEffect(() => {
    const fetchReportedVideos = async () => {
      const currentUser = getCurrentUser();
      if (currentUser) {
        try {
          const reportedIds = await getUserReports(currentUser.uid);
          setReportedVideoIds(new Set(reportedIds));
        } catch (error) {
          console.error('Error fetching reported videos:', error);
        }
      }
    };

    fetchReportedVideos();
  }, []);

  useEffect(() => {
    // Fetch videos when screen focuses
    const unsubscribe = navigation.addListener('focus', () => {
      fetchLatestVideos();
    });

    // Initial load
    fetchLatestVideos();

    // Subscribe to real-time view count updates for all videos in feed
    const videoSubscriptions = [];
    
    const setupVideoSubscriptions = () => {
      // Clear existing subscriptions
      videoSubscriptions.forEach((unsub) => {
        if (typeof unsub === 'function') {
          unsub();
        }
      });
      videoSubscriptions.length = 0;

      // Subscribe to each video's view count updates
      feedData.forEach((item) => {
        const videoId = item.video?.id || item.id;
        if (videoId) {
          const unsubscribe = subscribeToDocument(
            COLLECTIONS.VIDEOS,
            videoId,
            (videoDoc) => {
              if (videoDoc && videoDoc.views !== undefined) {
                setFeedData((prev) => {
                  return prev.map((prevItem) => {
                    if ((prevItem.video?.id || prevItem.id) === videoId) {
                      return {
                        ...prevItem,
                        views: formatViews(videoDoc.views || 0),
                        video: prevItem.video ? { ...prevItem.video, views: videoDoc.views || 0 } : prevItem.video,
                      };
                    }
                    return prevItem;
                  });
                });
              }
            }
          );
          videoSubscriptions.push(unsubscribe);
        }
      });
    };

    // Setup subscriptions when feedData changes
    if (feedData.length > 0) {
      setupVideoSubscriptions();
    }

    return () => {
      unsubscribe();
      // Unsubscribe from all video updates
      videoSubscriptions.forEach((unsub) => {
        if (typeof unsub === 'function') {
          unsub();
        }
      });
      // Pause all videos on unmount
      Object.keys(videoRefs.current).forEach((key) => {
        if (videoRefs.current[key]) {
          videoRefs.current[key].pause();
        }
      });
      // Clear view tracking timers
      Object.keys(viewTrackingTimers.current).forEach((key) => {
        clearTimeout(viewTrackingTimers.current[key]);
      });
      viewTrackingTimers.current = {};
      videoPlayStartTimes.current = {};
    };
  }, [navigation, feedData.length]); // Only re-run when feedData length changes to avoid infinite loops

  // Pause videos when screen loses focus
  useEffect(() => {
    const unsubscribeBlur = navigation.addListener('blur', () => {
      // Pause all videos via refs
      Object.keys(videoRefs.current).forEach((key) => {
        if (videoRefs.current[key]) {
          videoRefs.current[key].pause();
        }
      });
      // Add all video indices to pausedVideos set
      const allIndices = feedData.map((_, index) => index);
      setPausedVideos(new Set(allIndices));
      setCurrentVisibleIndex(null);
      // Hide all controls
      setVisibleControls(new Set());
      // Clear all timers
      Object.keys(controlTimers.current).forEach((key) => {
        clearTimeout(controlTimers.current[key]);
      });
      controlTimers.current = {};
    });

    return unsubscribeBlur;
  }, [navigation, feedData.length]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.keys(controlTimers.current).forEach((key) => {
        clearTimeout(controlTimers.current[key]);
      });
      controlTimers.current = {};
    };
  }, []);

  // Handle video visibility changes
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const visibleIndex = viewableItems[0].index;
      setCurrentVisibleIndex(visibleIndex);
      
      // Don't clear controls when video becomes visible - let user interaction control visibility
      // Only hide controls for videos that are no longer visible
      setVisibleControls((prev) => {
        const newSet = new Set();
        // Keep controls for the currently visible video if they were shown
        if (visibleIndex !== null && visibleIndex !== undefined && prev.has(visibleIndex)) {
          newSet.add(visibleIndex);
        }
        return newSet;
      });
      
      // Track view for visible video
      if (visibleIndex !== null && visibleIndex !== undefined && feedData[visibleIndex]) {
        const videoItem = feedData[visibleIndex];
        const videoId = videoItem.video?.id || videoItem.id;
        
        if (videoId && !viewRecorded.current.has(videoId)) {
          // Record start time for view tracking
          videoPlayStartTimes.current[videoId] = Date.now();
          
          // Set timer to record view after minimum duration (3 seconds)
          if (viewTrackingTimers.current[videoId]) {
            clearTimeout(viewTrackingTimers.current[videoId]);
          }
          
          viewTrackingTimers.current[videoId] = setTimeout(async () => {
            const playDuration = Date.now() - (videoPlayStartTimes.current[videoId] || Date.now());
            const recorded = await trackViewWithDuration(videoId, 'homescreen', playDuration);
            
            if (recorded) {
              viewRecorded.current.add(videoId);
              // Update local view count
              setFeedData((prev) => {
                return prev.map((item) => {
                  if ((item.video?.id || item.id) === videoId) {
                    const currentViews = parseInt(item.views) || 0;
                    return {
                      ...item,
                      views: formatViews(currentViews + 1),
                      video: item.video ? { ...item.video, views: (item.video.views || 0) + 1 } : item.video,
                    };
                  }
                  return item;
                });
              });
            }
            
            delete viewTrackingTimers.current[videoId];
            delete videoPlayStartTimes.current[videoId];
          }, 3000); // 3 seconds minimum view duration
        }
      }
      
      // Pause all other videos
      Object.keys(videoRefs.current).forEach((key) => {
        if (key !== visibleIndex?.toString() && videoRefs.current[key]) {
          videoRefs.current[key].pause();
        }
      });
    } else {
      // Pause all videos if nothing is visible
      Object.keys(videoRefs.current).forEach((key) => {
        if (videoRefs.current[key]) {
          videoRefs.current[key].pause();
        }
      });
      setCurrentVisibleIndex(null);
      // Hide all controls
      setVisibleControls(new Set());
      // Clear all timers
      Object.keys(controlTimers.current).forEach((key) => {
        clearTimeout(controlTimers.current[key]);
      });
      controlTimers.current = {};
      
      // Clear view tracking timers
      Object.keys(viewTrackingTimers.current).forEach((key) => {
        clearTimeout(viewTrackingTimers.current[key]);
        delete viewTrackingTimers.current[key];
      });
    }
  }).current;

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50, // Video is considered visible when 50% is shown
    minimumViewTime: 300, // Minimum time in viewport before considering it visible
  };

  // Toggle pause/resume for a video
  const togglePause = (index) => {
    setPausedVideos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Toggle mute/unmute for a video
  const toggleMute = async (index) => {
    const videoRef = videoRefs.current[index.toString()];
    if (videoRef) {
      try {
        const isCurrentlyMuted = mutedVideos.has(index);
        await videoRef.setIsMutedAsync(!isCurrentlyMuted);
        
        setMutedVideos((prev) => {
          const newSet = new Set(prev);
          if (isCurrentlyMuted) {
            newSet.delete(index);
          } else {
            newSet.add(index);
          }
          return newSet;
        });
      } catch (error) {
        console.error('Error toggling mute:', error);
      }
    } else {
      // Fallback: update state even if ref is not available
      setMutedVideos((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(index)) {
          newSet.delete(index);
        } else {
          newSet.add(index);
        }
        return newSet;
      });
    }
  };

  // Show controls for a video and auto-hide after 2 seconds
  const showControls = (index) => {
    setVisibleControls((prev) => {
      const newSet = new Set(prev);
      newSet.add(index);
      return newSet;
    });

    // Clear existing timer for this video
    if (controlTimers.current[index]) {
      clearTimeout(controlTimers.current[index]);
    }

    // Auto-hide after 2 seconds
    controlTimers.current[index] = setTimeout(() => {
      setVisibleControls((prev) => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
      delete controlTimers.current[index];
    }, 2000);
  };

  // Hide controls immediately
  const hideControls = (index) => {
    setVisibleControls((prev) => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
    if (controlTimers.current[index]) {
      clearTimeout(controlTimers.current[index]);
      delete controlTimers.current[index];
    }
  };

  // Toggle controls visibility
  const toggleControls = (index) => {
    if (visibleControls.has(index)) {
      hideControls(index);
    } else {
      showControls(index);
    }
  };

  const handleReportVideo = async (reason) => {
    if (!reportingVideo || !reportingVideo.video) {
      Alert.alert('Error', 'Unable to report this video.');
      return;
    }

    try {
      const videoId = reportingVideo.video.id || reportingVideo.id;
      await reportVideo(videoId, reason, 'video');
      
      // Add to reported videos set
      setReportedVideoIds((prev) => {
        const newSet = new Set(prev);
        newSet.add(videoId);
        return newSet;
      });

      // Remove from feed data
      setFeedData((prev) => prev.filter((item) => {
        const itemVideoId = item.video?.id || item.id;
        return itemVideoId !== videoId;
      }));

      setShowReportModal(false);
      setReportingVideo(null);
    } catch (error) {
      console.error('Error reporting video:', error);
      throw error;
    }
  };

  const renderPost = ({ item, index }) => {
    const currentUser = getCurrentUser();
    const currentUserId = currentUser?.uid;
    const videoOwnerId = item.user?.id || item.video?.userId;
    const isOwnPost = currentUserId && videoOwnerId && currentUserId === videoOwnerId;
    
    const isVisible = currentVisibleIndex === index;
    const isPaused = pausedVideos.has(index);
    const isMuted = mutedVideos.has(index);
    const shouldPlay = isVisible && !isPaused;
    const controlsVisible = visibleControls.has(index);
    
    const videoRef = (ref) => {
      if (ref) {
        videoRefs.current[index.toString()] = ref;
      } else {
        delete videoRefs.current[index.toString()];
      }
    };

    const handleVideoTap = () => {
      // Always show controls on tap, regardless of current state
      showControls(index);
    };

    const handlePauseToggle = () => {
      togglePause(index);
      showControls(index); // Show controls when toggling pause
    };

    const handleUserPress = async () => {
      const currentUser = getCurrentUser();
      const currentUserId = currentUser?.uid;

      if (item.user) {
        const userId = item.user.id || item.video?.userId;
        
        // Check if it's the current user
        if (userId === currentUserId) {
          // Navigate to ProfileScreen (own profile)
          navigation.navigate('Profile');
          return;
        }

        // Format user data for UserProfileScreen
        const userData = {
          id: userId,
          username: item.user.userName || item.user.displayName || item.username,
          name: item.user.displayName || item.user.userName || item.username,
          profession: item.user.profession || 'Content Creator',
          avatar: item.user.profileImage || (typeof item.profileImage === 'object' && item.profileImage.uri ? item.profileImage.uri : null),
          followers: item.user.followers || 0,
          following: item.user.following || 0,
          winBattle: item.user.totalBattles > 0 
            ? `${item.user.battlesWon || 0}/${item.user.totalBattles}` 
            : '0/0',
          // Include full user object for additional data
          ...item.user,
        };
        navigation.navigate('UserProfile', {
          user: userData,
        });
      } else if (item.video?.userId) {
        // If user data is missing, fetch it
        try {
          const userId = item.video.userId;
          
          // Check if it's the current user
          if (userId === currentUserId) {
            // Navigate to ProfileScreen (own profile)
            navigation.navigate('Profile');
            return;
          }

          const userProfile = await getDocument(COLLECTIONS.USERS, userId);
          if (userProfile) {
            const userData = {
              id: userProfile.id || userId,
              username: userProfile.userName || userProfile.displayName || item.username,
              name: userProfile.displayName || userProfile.userName || item.username,
              profession: userProfile.profession || 'Content Creator',
              avatar: userProfile.profileImage || null,
              followers: userProfile.followers || 0,
              following: userProfile.following || 0,
              winBattle: userProfile.totalBattles > 0 
                ? `${userProfile.battlesWon || 0}/${userProfile.totalBattles}` 
                : '0/0',
              ...userProfile,
            };
            navigation.navigate('UserProfile', {
              user: userData,
            });
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };

    return (
      <View style={styles.postContainer}>
        {/* User Header */}
        <View style={styles.postHeader}>
          <TouchableOpacity style={styles.userInfo} onPress={handleUserPress}>
            <Image source={item.profileImage} style={styles.profileImage} />
            <View style={styles.userDetails}>
              <View style={styles.usernameRow}>
                <Text style={styles.username}>{item.username}</Text>
                <Text style={styles.timeAgo}>{item.timeAgo}</Text>
              </View>
            </View>
          </TouchableOpacity>
          {!isOwnPost && (
            <TouchableOpacity
              style={styles.challengeButton}
              onPress={() =>
                navigation.navigate("Challenge", {
                  post: item,
                  video: item.video,
                })
              }
            >
              <Text style={styles.challengeButtonText}>Challenge</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Video Content */}
        <View style={styles.videoContainer}>
          {item.videoUrl ? (
            <>
              <Video
                ref={videoRef}
                source={{ uri: item.videoUrl }}
                style={styles.videoPlayer}
                resizeMode="cover"
                paused={!shouldPlay}
                repeat={true}
                muted={isMuted}
                playInBackground={false}
                playWhenInactive={false}
                ignoreSilentSwitch="ignore"
                onError={(error) => {
                  console.error("Video playback error:", error);
                }}
                onLoad={() => {
                  // Set initial mute state when video loads
                  const videoRef = videoRefs.current[index.toString()];
                  if (videoRef && isMuted) {
                    videoRef.setIsMutedAsync(true).catch(() => {});
                  }
                }}
              />
              {/* Thumbnail overlay (shown when video is paused or not visible) */}
              {(!isVisible || isPaused) && (
                <Image
                  source={item.videoThumbnail}
                  style={styles.videoThumbnail}
                />
              )}
              {/* Top left overlay - Duration */}
              <View style={styles.videoOverlayTop} pointerEvents="none">
                <View style={styles.durationBadge}>
                  <Text style={styles.videoDuration}>{item.videoDuration}</Text>
                </View>
              </View>
              {/* Tap overlay - captures all taps on video */}
              <TouchableOpacity
                style={styles.videoTapOverlay}
                activeOpacity={1}
                onPress={handleVideoTap}
              >
                {/* Center play/pause button - Only visible when controls are shown */}
                {controlsVisible && (
                  <TouchableOpacity
                    style={styles.centerPlayButton}
                    onPress={handlePauseToggle}
                    activeOpacity={0.7}
                  >
                    <View style={styles.centerPlayButtonBg}>
                      <Ionicons
                        name={isPaused ? "play" : "pause"}
                        size={32}
                        color={colors.textLight}
                      />
                    </View>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
              {/* Bottom right controls - Mute/Unmute - Always visible
              <View style={styles.videoControls}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => toggleMute(index)}
                  activeOpacity={0.7}
                >
                  <View style={styles.controlButtonBg}>
                    <Ionicons 
                      name={isMuted ? "volume-mute" : "volume-high"} 
                      size={20} 
                      color={colors.textLight} 
                    />
                  </View>
                </TouchableOpacity>
              </View> */}
            </>
          ) : (
            <>
              <Image
                source={item.videoThumbnail}
                style={styles.videoThumbnail}
              />
              <View style={styles.videoOverlayTop}>
                <View style={styles.durationBadge}>
                  <Text style={styles.videoDuration}>{item.videoDuration}</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Views and Report */}
        <View style={styles.viewsContainer}>
          <Text style={styles.views}>
            {item.views} View{item.views !== "1" ? "s" : ""}
          </Text>
          <TouchableOpacity
            style={styles.reportButtonBottom}
            onPress={() => {
              setReportingVideo(item);
              setShowReportModal(true);
            }}
          >
            <Ionicons name="flag-outline" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Caption */}
        <View style={styles.captionContainer}>
          <View style={styles.captionRow}>
            <TouchableOpacity onPress={handleUserPress} activeOpacity={0.7}>
              <Text style={styles.captionUsername}>{item.username}</Text>
            </TouchableOpacity>
            <Text style={styles.captionText}> {item.caption}</Text>
          </View>
          {item.hasTranslation && (
            <TouchableOpacity>
              <Text style={styles.translationLink}>See translation</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Description */}
        {item.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>{item.description}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <HeaderSvg width={150} height={40} />
        <View style={styles.headerIcons}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => navigation.navigate('Search')}
          >
            <SearchSvg width={24} height={24} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => navigation.navigate('Inbox')}
          >
            <View style={styles.messageIconContainer}>
              <MessageSvg width={24} height={24} />
              {hasUnreadNotifications && (
                <View style={styles.notificationBadge} />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Feed */}
      {feedData.length > 0 ? (
        <FlatList
          data={feedData}
          renderItem={({ item, index }) => renderPost({ item, index })}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.feedContent}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          removeClippedSubviews={false}
          onRefresh={() => fetchLatestVideos(true)}
          refreshing={loading}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="videocam-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No videos yet</Text>
          <Text style={styles.emptySubtext}>Be the first to upload a battle!</Text>
        </View>
      )}

      {/* Loading Modal */}
      <LoadingModal visible={loading} />
      
      {/* Report Modal */}
      <ReportModal
        visible={showReportModal}
        onClose={() => {
          setShowReportModal(false);
          setReportingVideo(null);
        }}
        onReport={handleReportVideo}
        videoTitle={reportingVideo?.username || 'this video'}
      />
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
  logo: {
    width: 150,
    height: 40,
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  iconButton: {
    padding: 4,
  },
  feedList: {
    flex: 1,
  },
  feedContent: {
    // paddingBottom: 20,
  },
  postContainer: {
    marginBottom: 30,
    // maxHeight: screenHeight * 0.6,
    // height: screenHeight * 0.6,
    // overflow: "hidden",
    // borderWidth: 1,
    // borderColor: colors.border,

  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  username: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginRight: 4,
  },
  timeAgo: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  challengeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#582FFF",
    borderRadius: 6,
    minWidth: 90,
  },
  challengeButtonText: {
    color: colors.textLight,
    fontSize: 14,
    fontFamily: fonts.semiBold,
  },
  videoContainer: {
    width: "100%",
    aspectRatio: 9 / 16,
    backgroundColor: colors.border,
    position: "relative",
    overflow: "hidden",
  },
  videoPlayer: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  videoThumbnail: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  videoOverlayTop: {
    position: "absolute",
    top: 12,
    left: 12,
    zIndex: 10,
  },
  durationBadge: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  videoDuration: {
    color: colors.textLight,
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  videoTapOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  videoCenterControls: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  centerPlayButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  centerPlayButtonBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  videoControls: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "column",
    gap: 12,
    zIndex: 10,
  },
  controlButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  controlButtonBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  viewsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  views: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  reportButtonBottom: {
    padding: 4,
  },
  descriptionContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    zIndex: 1000,
    backgroundColor: colors.background,
  },
  description: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    fontFamily: fonts.regular,
  },
  captionContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  captionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  caption: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  captionText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    fontFamily: fonts.regular,
    flex: 1,
  },
  captionUsername: {
    fontFamily: fonts.semiBold,
    color: colors.text,
    fontSize: 14,
  },
  translationLink: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
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
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default HomeScreen;

