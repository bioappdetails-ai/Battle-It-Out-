import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  StatusBar,
  Modal,
  Animated,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import PagerView from 'react-native-pager-view';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import { useFocusEffect } from '@react-navigation/native';
import colors from '../../config/colors';
import fonts from '../../config/fonts';
import LoadingModal from '../../components/LoadingModal';
import VSSvg from '../../assets/VS.svg';
import VoteSvg from '../../assets/vote.svg';
import FlashDiskSvg from '../../assets/discover/Flash Disk 2.svg';
import ShowSvg from '../../assets/discover/Show.svg';
import TimeCircleSvg from '../../assets/discover/Time Circle 4.svg';
import { getDocuments, getDocument, createDocument, deleteDocument, COLLECTIONS, timestampToDate, subscribeToDocument, incrementField } from '../../services/firestoreService';
import { getCurrentUser } from '../../services/authService';
import { trackViewWithDuration } from '../../services/viewService';
import { generateUUID } from '../../utils/uuid';
import { serverTimestamp, increment } from 'firebase/firestore';
import { Alert } from 'react-native';
import ReportModal from '../../components/ReportModal';
import { reportVideo, getUserReports } from '../../services/reportService';

const { width, height } = Dimensions.get('window');


const DiscoverScreen = ({ navigation }) => {
  const [battleData, setBattleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentBattleIndex, setCurrentBattleIndex] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState(1); // 1 or 2
  const [paused, setPaused] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [videoOrientation, setVideoOrientation] = useState('vertical'); // 'vertical' or 'horizontal'
  const [showDetails, setShowDetails] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingVideo, setReportingVideo] = useState(null);
  const [reportedVideoIds, setReportedVideoIds] = useState(new Set());
  const [showVSPopup, setShowVSPopup] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [savedVideos, setSavedVideos] = useState(new Set()); // Track saved video IDs
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState('New'); // 'New', 'Trending', 'Game Battles', or specific category
  const pagerRef = useRef(null);
  const videoRef = useRef(null);
  const videoEndedRef = useRef(false);
  const viewRecorded = useRef(new Set()); // Track which videos have already recorded views
  const videoPlayStartTimes = useRef({}); // Track when videos started playing
  const translateX = useRef(new Animated.Value(0)).current;
  const detailsTranslateX = useRef(new Animated.Value(width)).current;
  const vsPopupScale = useRef(new Animated.Value(0)).current;
  const vsPopupOpacity = useRef(new Animated.Value(0)).current;
  const vsPopupRotation = useRef(new Animated.Value(0)).current;

  const currentBattle = battleData[currentBattleIndex] || null;
  const currentVideo = currentBattle ? (currentPlayer === 1 ? currentBattle.player1 : currentBattle.player2) : null;

  // Fetch battles from Firestore
  const fetchBattles = async (category = activeCategory) => {
    try {
      setLoading(true);
      
      let battles = [];
      
      // Fetch battles based on category
      if (category === 'New') {
        // Fetch active battles ordered by creation date (newest first)
        battles = await getDocuments(
          COLLECTIONS.BATTLES,
          [{ field: 'status', operator: '==', value: 'active' }],
          'createdAt',
          'desc',
          20 // Limit to 20 battles
        );
      } else if (category === 'Trending') {
        // Fetch battles with most votes (trending)
        battles = await getDocuments(
          COLLECTIONS.BATTLES,
          [{ field: 'status', operator: '==', value: 'active' }],
          'totalVotes',
          'desc',
          20
        );
      } else if (category === 'Game Battles') {
        // Fetch battles in game-related categories
        const gameCategories = ['Sports', 'Racing', 'Gym', 'Swimming'];
        battles = await getDocuments(
          COLLECTIONS.BATTLES,
          [
            { field: 'status', operator: '==', value: 'active' },
            { field: 'category', operator: 'in', value: gameCategories },
          ],
          'createdAt',
          'desc',
          20
        );
      } else {
        // Fetch battles by specific category
        battles = await getDocuments(
          COLLECTIONS.BATTLES,
          [
            { field: 'status', operator: '==', value: 'active' },
            { field: 'category', operator: '==', value: category },
          ],
          'createdAt',
          'desc',
          20
        );
      }

      console.log('✅ Fetched battles from Firestore:', battles.length);

      // Transform battles to match DiscoverScreen format
      const transformedBattles = await Promise.all(
        battles.map(async (battle) => {
          // Get user profiles for both players
          let player1User = null;
          let player2User = null;
          let player1Video = null;
          let player2Video = null;

          try {
            if (battle.player1UserId) {
              player1User = await getDocument(COLLECTIONS.USERS, battle.player1UserId);
            }
            if (battle.player2UserId) {
              player2User = await getDocument(COLLECTIONS.USERS, battle.player2UserId);
            }
            // Fetch video documents to get duration
            if (battle.player1VideoId) {
              player1Video = await getDocument(COLLECTIONS.VIDEOS, battle.player1VideoId);
            }
            if (battle.player2VideoId) {
              player2Video = await getDocument(COLLECTIONS.VIDEOS, battle.player2VideoId);
            }
          } catch (error) {
            console.error('Error fetching user profiles or videos:', error);
          }

          // Format duration from seconds to display format
          const formatDuration = (seconds) => {
            if (!seconds) return 0;
            return Math.round(seconds);
          };
          
          // Format views count
          const formatViews = (count) => {
            if (!count) return '0';
            if (count < 1000) return count.toString();
            if (count < 1000000) return `${(count / 1000).toFixed(1)}K`.replace('.0', '');
            return `${(count / 1000000).toFixed(1)}M`.replace('.0', '');
          };

          // Get duration from video document or battle data
          const player1Duration = player1Video?.duration || battle.player1Duration || 0;
          const player2Duration = player2Video?.duration || battle.player2Duration || 0;

          return {
            id: battle.id,
            battleId: battle.id,
            category: battle.category || 'General',
            player1: {
              id: battle.player1UserId,
              name: battle.player1UserName || player1User?.displayName || player1User?.userName || 'Player 1',
              avatar: battle.player1ProfileImage || player1User?.profileImage || 'https://i.pravatar.cc/150?img=1',
              videoUri: battle.player1VideoUrl,
              thumbnailUrl: battle.player1ThumbnailUrl || player1Video?.thumbnailUrl || null,
              caption: battle.player1Title || battle.player1Description || '',
              votes: battle.player1Votes || 0, // For BattleViewScreen
              videoId: battle.player1VideoId,
              stats: {
                saves: battle.player1Saves || 0,
                views: battle.player1Views || 0,
                time: formatDuration(player1Duration),
              },
            },
            player2: {
              id: battle.player2UserId,
              name: battle.player2UserName || player2User?.displayName || player2User?.userName || 'Player 2',
              avatar: battle.player2ProfileImage || player2User?.profileImage || 'https://i.pravatar.cc/150?img=2',
              videoUri: battle.player2VideoUrl,
              thumbnailUrl: battle.player2ThumbnailUrl || player2Video?.thumbnailUrl || null,
              caption: battle.player2Title || battle.player2Description || '',
              votes: battle.player2Votes || 0, // For BattleViewScreen
              videoId: battle.player2VideoId,
              stats: {
                saves: battle.player2Saves || 0,
                views: battle.player2Views || 0,
                time: formatDuration(player2Duration),
              },
            },
            // Additional data for BattleViewScreen
            totalVotes: battle.totalVotes || 0,
            createdAt: battle.createdAt,
            recentVotes: [], // Can be fetched separately if needed
          };
        })
      );

      // Filter out reported videos
      const currentUser = getCurrentUser();
      if (currentUser && reportedVideoIds.size > 0) {
        const filteredBattles = transformedBattles.filter((battle) => {
          const player1VideoId = battle.player1?.videoId;
          const player2VideoId = battle.player2?.videoId;
          const battleId = battle.id || battle.battleId;
          
          // Filter out if battle ID or any video ID is reported
          return !reportedVideoIds.has(battleId) &&
                 !reportedVideoIds.has(player1VideoId) &&
                 !reportedVideoIds.has(player2VideoId);
        });
        setBattleData(filteredBattles);
      } else {
        setBattleData(transformedBattles);
      }
    } catch (error) {
      console.error('❌ Error fetching battles:', error);
      // Set empty array on error
      setBattleData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch saved videos for current user
  const fetchSavedVideos = async () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) return;

      const saved = await getDocuments(
        COLLECTIONS.SAVED_VIDEOS,
        [{ field: 'userId', operator: '==', value: currentUser.uid }]
      );

      const savedVideoIds = new Set(saved.map(item => item.videoId || item.battleId));
      setSavedVideos(savedVideoIds);
    } catch (error) {
      console.error('Error fetching saved videos:', error);
    }
  };

  // Calculate time remaining (24 hours from battle start)
  const calculateTimeRemaining = (battle) => {
    if (!battle || !battle.createdAt) return 0;
    
    try {
      const battleStartTime = timestampToDate(battle.createdAt);
      const now = new Date();
      const elapsedSeconds = Math.floor((now - battleStartTime) / 1000);
      const totalSeconds = 24 * 60 * 60; // 24 hours in seconds
      const remaining = Math.max(0, totalSeconds - elapsedSeconds);
      return remaining;
    } catch (error) {
      return 0;
    }
  };

  // Format time remaining
  const formatTimeRemaining = (seconds) => {
    if (seconds <= 0) return '0h';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Handle save/unsave video
  const handleSaveVideo = async () => {
    if (!currentBattle || !currentVideo) return;

    const currentUser = getCurrentUser();
    if (!currentUser) {
      Alert.alert('Error', 'You need to be logged in to save videos.');
      return;
    }

    try {
      setSaving(true);
      
      const videoId = currentPlayer === 1 
        ? (currentBattle.player1?.videoId || currentBattle.player1VideoId || currentBattle.id + '_p1')
        : (currentBattle.player2?.videoId || currentBattle.player2VideoId || currentBattle.id + '_p2');
      
      const battleId = currentBattle.battleId || currentBattle.id;
      
      // Check if already saved
      const existingSaved = await getDocuments(
        COLLECTIONS.SAVED_VIDEOS,
        [
          { field: 'userId', operator: '==', value: currentUser.uid },
          { field: 'battleId', operator: '==', value: battleId },
        ]
      );
      
      // Filter by player number if multiple videos from same battle
      const savedForThisPlayer = existingSaved.find(
        item => item.videoId === videoId || item.playerNumber === currentPlayer
      );
      
      const isSaved = savedForThisPlayer !== undefined;

      if (isSaved) {
        // Unsave video - delete the saved item
        if (savedForThisPlayer) {
          await deleteDocument(COLLECTIONS.SAVED_VIDEOS, savedForThisPlayer.id);
        }

        setSavedVideos(prev => {
          const newSet = new Set(prev);
          newSet.delete(videoId);
          newSet.delete(battleId);
          return newSet;
        });
        
        Alert.alert('Success', 'Video removed from saved');
      } else {
        // Save video
        const savedId = generateUUID();
        if (!currentVideo) {
          Alert.alert('Error', 'Video data not available');
          return;
        }

        const savedData = {
          userId: currentUser.uid,
          videoId: videoId,
          battleId: battleId,
          videoUrl: currentVideo.videoUri,
          thumbnailUrl: currentVideo.thumbnailUrl,
          title: currentVideo.caption || currentBattle.category,
          playerNumber: currentPlayer,
          playerName: currentVideo.name,
          category: currentBattle.category,
          createdAt: serverTimestamp(),
        };

        await createDocument(COLLECTIONS.SAVED_VIDEOS, savedData, savedId);
        
        setSavedVideos(prev => new Set([...prev, videoId, battleId]));
        Alert.alert('Success', 'Video saved successfully');
      }
    } catch (error) {
      console.error('Error saving/unsaving video:', error);
      Alert.alert('Error', 'Failed to save video. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Fetch battles when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchBattles(activeCategory);
      fetchSavedVideos();
      
      // Cleanup: Pause video when leaving screen
      return () => {
        if (videoRef.current) {
          videoRef.current.pauseAsync().catch(() => {});
        }
        setPaused(true);
      };
    }, [activeCategory])
  );

  useEffect(() => {
    // Reset when battle changes
    if (currentBattle) {
      setCurrentPlayer(1);
      setVideoEnded(false);
      setShowVSPopup(false);
      setPaused(false);
      setVideoProgress(0);
      videoEndedRef.current = false;
    }
  }, [currentBattleIndex, currentBattle]);

  // Refresh saved videos check when current video changes
  useEffect(() => {
    if (currentVideo && currentBattle) {
      const checkSaved = async () => {
        const currentUser = getCurrentUser();
        if (!currentUser) return;

        try {
          const videoId = currentPlayer === 1 
            ? (currentBattle.player1?.videoId || currentBattle.player1VideoId)
            : (currentBattle.player2?.videoId || currentBattle.player2VideoId);
          
          const battleId = currentBattle.battleId || currentBattle.id;
          
          const existingSaved = await getDocuments(
            COLLECTIONS.SAVED_VIDEOS,
            [
              { field: 'userId', operator: '==', value: currentUser.uid },
              { field: 'battleId', operator: '==', value: battleId },
            ]
          );
          
          const savedForThisPlayer = existingSaved.find(
            item => item.videoId === videoId || item.playerNumber === currentPlayer
          );
          
          if (savedForThisPlayer) {
            setSavedVideos(prev => new Set([...prev, videoId, battleId]));
          }
        } catch (error) {
          console.error('Error checking saved state:', error);
        }
      };
      
      checkSaved();
    }
  }, [currentVideo, currentPlayer, currentBattle]);

  const handlePageChange = (e) => {
    const index = e.nativeEvent.position;
    setCurrentBattleIndex(index);
    setCurrentPlayer(1);
    setPaused(false);
    setShowDetails(false);
    setVideoEnded(false);
    setShowVSPopup(false);
    setVideoProgress(0);
    videoEndedRef.current = false;
    translateX.setValue(0);
    detailsTranslateX.setValue(width);
  };

  const handleVideoEnd = () => {
    if (videoEndedRef.current) return; // Prevent multiple calls
    videoEndedRef.current = true;
    
    if (currentPlayer === 1) {
      // First video ended, show VS popup
      setVideoEnded(true);
      setPaused(true);
      setShowVSPopup(true);
      
      // Reset animation values
      vsPopupScale.setValue(0);
      vsPopupOpacity.setValue(0);
      vsPopupRotation.setValue(0);
      
      // Create animated sequence with multiple effects
      Animated.parallel([
        // Scale animation with bounce
        Animated.sequence([
          Animated.spring(vsPopupScale, {
            toValue: 1.2,
            useNativeDriver: true,
            tension: 30,
            friction: 5,
          }),
          Animated.spring(vsPopupScale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
          }),
        ]),
        // Opacity fade in
        Animated.timing(vsPopupOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        // Rotation animation
        Animated.sequence([
          Animated.timing(vsPopupRotation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(vsPopupRotation, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        // Animation in complete, immediately start animation out
        Animated.parallel([
          Animated.spring(vsPopupScale, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
          }),
          Animated.timing(vsPopupOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Animation out complete, switch to player 2 immediately
          setShowVSPopup(false);
          setCurrentPlayer(2);
          setPaused(false);
          setVideoEnded(false);
          setVideoProgress(0);
          videoEndedRef.current = false;
        });
      });
    } else if (currentPlayer === 2) {
      // Second video ended, navigate to BattleView
      setVideoEnded(true);
      setPaused(true);
      
      // Small delay before navigation for smooth transition
      setTimeout(() => {
        navigation.navigate('BattleView', { battle: currentBattle });
      }, 500);
    }
  };

  const togglePause = () => {
    setPaused(!paused);
  };

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

  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
    // Reset orientation when closing fullscreen
    if (fullscreen) {
      setVideoOrientation('vertical');
    }
  };

  const toggleVideoOrientation = () => {
    setVideoOrientation((prev) => (prev === 'vertical' ? 'horizontal' : 'vertical'));
  };

  const handleReportVideo = async (reason) => {
    if (!currentVideo || !currentVideo.videoId) {
      Alert.alert('Error', 'Unable to report this video.');
      return;
    }

    try {
      const battleId = currentBattle?.id || currentBattle?.battleId;
      await reportVideo(currentVideo.videoId, reason, 'battle', battleId);
      
      // Add to reported videos set
      setReportedVideoIds((prev) => {
        const newSet = new Set(prev);
        newSet.add(currentVideo.videoId);
        if (battleId) {
          newSet.add(battleId);
        }
        return newSet;
      });

      // Remove from battle data
      setBattleData((prev) => prev.filter((battle) => {
        const battleIdToCheck = battle.id || battle.battleId;
        return battleIdToCheck !== battleId;
      }));

      setShowReportModal(false);
      setReportingVideo(null);
    } catch (error) {
      console.error('Error reporting video:', error);
      throw error;
    }
  };

  const handleHorizontalSwipe = (event) => {
    const { translationX, state } = event.nativeEvent;
    
    if (state === 2) {
      // Active gesture - update position
      const newX = Math.max(-width, Math.min(0, translationX));
      translateX.setValue(newX);
      detailsTranslateX.setValue(width + newX);
    } else if (state === 5) {
      // Gesture ended
      if (translationX < -width / 3) {
        // Swipe left enough - navigate to BattleView
        navigation.navigate('BattleView', { battle: currentBattle });
      } else {
        // Not enough swipe - hide details
        setShowDetails(false);
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
          }),
          Animated.spring(detailsTranslateX, {
            toValue: width,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
          }),
        ]).start();
      }
    }
  };

  const renderVideoItem = (battle, index) => {
    if (!battle) return null;
    
    const isActive = index === currentBattleIndex;
    const isPaused = paused && isActive;
    const video = currentPlayer === 1 ? battle.player1 : battle.player2;

    if (!video || !video.videoUri) {
      return (
        <View key={battle.id} style={styles.videoContainer}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Video not available</Text>
          </View>
        </View>
      );
    }

    return (
      <View key={battle.id} style={styles.videoContainer}>
        <Video
          ref={isActive ? videoRef : null}
          source={{ uri: video.videoUri }}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          isLooping={false}
          shouldPlay={isActive && !isPaused && !videoEnded}
          isMuted={false}
          useNativeControls={false}
          onPlaybackStatusUpdate={(status) => {
            // Update progress based on actual video duration
            if (
              status.isLoaded &&
              status.positionMillis !== undefined &&
              status.positionMillis !== null &&
              status.durationMillis !== undefined &&
              status.durationMillis > 0
            ) {
              const progress = Math.min(status.positionMillis / status.durationMillis, 1);
              setVideoProgress(progress);
            }
            
            // Track view when video plays for minimum duration
            if (status.isLoaded && status.positionMillis !== undefined && status.positionMillis !== null) {
              const videoId = currentPlayer === 1 
                ? (battle.player1?.videoId || battle.player1VideoId)
                : (battle.player2?.videoId || battle.player2VideoId);
              const playDuration = status.positionMillis;
              const viewKey = `${battle.id}_player${currentPlayer}`;
              
              // Record view after 3 seconds of playback
              if (playDuration >= 3000 && videoId && !viewRecorded.current.has(viewKey)) {
                trackViewWithDuration(videoId, 'discoverscreen', playDuration).then((recorded) => {
                  if (recorded) {
                    viewRecorded.current.add(viewKey);
                    // Update battle view counts
                    const viewField = currentPlayer === 1 ? 'player1Views' : 'player2Views';
                    incrementField(COLLECTIONS.BATTLES, battle.id, viewField, 1).catch(() => {});
                    
                    // Update local state
                    setBattleData((prev) => {
                      return prev.map((prevBattle) => {
                        if (prevBattle.id === battle.id) {
                          const updatedBattle = { ...prevBattle };
                          if (currentPlayer === 1) {
                            updatedBattle.player1 = {
                              ...updatedBattle.player1,
                              stats: {
                                ...updatedBattle.player1.stats,
                                views: (updatedBattle.player1.stats?.views || 0) + 1,
                              },
                            };
                          } else {
                            updatedBattle.player2 = {
                              ...updatedBattle.player2,
                              stats: {
                                ...updatedBattle.player2.stats,
                                views: (updatedBattle.player2.stats?.views || 0) + 1,
                              },
                            };
                          }
                          return updatedBattle;
                        }
                        return prevBattle;
                      });
                    });
                  }
                }).catch(() => {
                  // Silently fail - don't break video playback
                });
              }
            }
            
            // Handle natural video end
            if (
              status.didJustFinish &&
              !status.isLooping &&
              !videoEndedRef.current
            ) {
              handleVideoEnd();
            }
          }}
          progressUpdateIntervalMillis={100}
        />

        {/* Progress Bar - Bottom of screen */}
        {isActive && (
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${videoProgress * 100}%`,
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* VS Popup */}
        {showVSPopup && isActive && (
          <Animated.View
            style={[
              styles.vsPopup,
              {
                opacity: vsPopupOpacity,
              },
            ]}
          >
            <Animated.View
              style={[
                styles.vsPopupContent,
                {
                  transform: [
                    { scale: vsPopupScale },
                    {
                      rotate: vsPopupRotation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", "360deg"],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.vsCircle}>
                <VSSvg width={60} height={107} />
              </View>
            </Animated.View>
          </Animated.View>
        )}

        {/* Overlay Content */}
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={colors.textLight} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Discover</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Bottom Left - User Info */}
          <View style={styles.userInfo}>
            <View style={styles.userHeader}>
              <Image source={{ uri: video.avatar }} style={styles.avatar} />
              <Text style={styles.userName}>{video.name}</Text>
              <View style={styles.categoryTag}>
                <Text style={styles.categoryText}>{battle.category}</Text>
              </View>
            </View>
            <Text style={styles.caption} numberOfLines={2}>
              {video.caption}
            </Text>
          </View>

          {/* Right Side - Action Icons */}
          <View style={styles.actionIcons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("BattleView", { battle })}
            >
              <FlashDiskSvg width={28} height={28} />
              <Text style={styles.actionCount}>{battle.totalVotes || 0}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <ShowSvg width={28} height={28} />
              <Text style={styles.actionCount}>
                {(() => {
                  const totalViews = ((battle.player1?.stats?.views || 0) + (battle.player2?.stats?.views || 0)) || video?.stats?.views || 0;
                  if (totalViews < 1000) return totalViews.toString();
                  if (totalViews < 1000000) return `${(totalViews / 1000).toFixed(1)}K`.replace('.0', '');
                  return `${(totalViews / 1000000).toFixed(1)}M`.replace('.0', '');
                })()}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <TimeCircleSvg width={28} height={28} />
              <Text style={styles.actionCount}>
                {formatTimeRemaining(calculateTimeRemaining(battle))}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleSaveVideo}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Ionicons 
                    name={
                      (currentVideo && savedVideos.has(currentVideo.videoId)) || 
                      savedVideos.has(battle.id) || 
                      savedVideos.has(battle.battleId) 
                        ? "bookmark" 
                        : "bookmark-outline"
                    } 
                    size={28} 
                    color={colors.textLight} 
                  />
                  <Text style={styles.actionCount}>Save</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                setReportingVideo(currentVideo);
                setShowReportModal(true);
              }}
            >
              <Ionicons name="flag-outline" size={28} color={colors.textLight} />
              <Text style={styles.actionCount}>Report</Text>
            </TouchableOpacity>
          </View>

          {/* Center - Play/Pause Button */}
          <TouchableOpacity
            style={styles.playPauseButton}
            onPress={togglePause}
            activeOpacity={0.7}
          >
            {isPaused && (
              <Ionicons name="play" size={60} color={colors.textLight} />
            )}
          </TouchableOpacity>
        </View>

        {/* Fullscreen Button - Outside overlay for better visibility */}
        <TouchableOpacity
          style={styles.fullscreenButton}
          onPress={toggleFullscreen}
        >
          <Ionicons
            name={fullscreen ? "contract" : "expand"}
            size={28}
            color={colors.textLight}
          />
        </TouchableOpacity>
      </View>
    );
  };

  const renderDetailsView = (battle) => {
  return (
      <View style={styles.detailsContainer}>
        <View style={styles.detailsHeader}>
          <TouchableOpacity
            onPress={() => {
              setShowDetails(false);
              Animated.parallel([
                Animated.spring(translateX, {
                  toValue: 0,
                  useNativeDriver: true,
                  tension: 50,
                  friction: 7,
                }),
                Animated.spring(detailsTranslateX, {
                  toValue: width,
                  useNativeDriver: true,
                  tension: 50,
                  friction: 7,
                }),
              ]).start();
            }}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>
        {currentVideo ? (
          <ScrollView style={styles.detailsContent}>
            <View style={styles.detailsUserInfo}>
              <Image
                source={{ uri: currentVideo.avatar }}
                style={styles.detailsAvatar}
              />
              <View style={styles.detailsUserText}>
                <Text style={styles.detailsUserName}>{currentVideo.name}</Text>
                <Text style={styles.detailsCategory}>{battle.category}</Text>
              </View>
            </View>
            <Text style={styles.detailsCaption}>{currentVideo.caption}</Text>
            <View style={styles.detailsStats}>
              <View style={styles.statItem}>
                <FlashDiskSvg width={20} height={20} />
                <Text style={styles.statText}>{currentVideo.stats?.saves || 0} Saves</Text>
              </View>
              <View style={styles.statItem}>
                <ShowSvg width={20} height={20} />
                <Text style={styles.statText}>
                  {(() => {
                    const views = currentVideo.stats?.views || 0;
                    if (views < 1000) return `${views} Views`;
                    if (views < 1000000) return `${(views / 1000).toFixed(1)}K`.replace('.0', '') + ' Views';
                    return `${(views / 1000000).toFixed(1)}M`.replace('.0', '') + ' Views';
                  })()}
                </Text>
              </View>
              <View style={styles.statItem}>
                <TimeCircleSvg width={20} height={20} />
                <Text style={styles.statText}>{currentVideo.stats?.time || 0}s Duration</Text>
              </View>
            </View>
          </ScrollView>
        ) : (
          <View style={styles.detailsContent}>
            <Text style={styles.errorText}>Video data not available</Text>
          </View>
        )}
    </View>
    );
  };

  // Available categories
  const categories = ['New', 'Trending', 'Game Battles', 'Music', 'Singing', 'Writing', 'Art', 'Sports', 'Gym', 'Food', 'Traveling', 'Racing', 'Swimming'];

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    setCurrentBattleIndex(0);
    setCurrentPlayer(1);
    setPaused(false);
    fetchBattles(category);
  };

  if (battleData.length === 0 && !loading) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <Ionicons name="trophy-outline" size={64} color={colors.textSecondary} />
        <Text style={styles.emptyText}>No battles yet</Text>
        <Text style={styles.emptySubtext}>Be the first to create a challenge!</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        {/* Category Filter */}
        <View style={styles.categoryContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContent}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  activeCategory === category && styles.categoryButtonActive,
                ]}
                onPress={() => handleCategoryChange(category)}
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    activeCategory === category && styles.categoryButtonTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <PagerView
          ref={pagerRef}
          style={styles.pagerView}
          initialPage={0}
          orientation="vertical"
          onPageSelected={handlePageChange}
        >
          {battleData.map((battle, index) => (
            <View key={battle.id} style={styles.pageContainer}>
              <PanGestureHandler
                onGestureEvent={Animated.event(
                  [{ nativeEvent: { translationX: translateX } }],
                  { useNativeDriver: true }
                )}
                onHandlerStateChange={handleHorizontalSwipe}
                activeOffsetX={[-10, 10]}
                failOffsetY={[-5, 5]}
              >
                <Animated.View
                  style={[
                    styles.swipeContainer,
                    {
                      transform: [{ translateX }],
                    },
                  ]}
                >
                  {renderVideoItem(battle, index)}
                  <Animated.View
                    style={[
                      styles.detailsWrapper,
                      {
                        transform: [{ translateX: detailsTranslateX }],
                      },
                    ]}
                  >
                    {renderDetailsView(battle)}
                  </Animated.View>
                </Animated.View>
              </PanGestureHandler>
            </View>
          ))}
        </PagerView>
      </View>

      {/* Fullscreen Modal */}
      <Modal
        visible={fullscreen && currentVideo !== null}
        transparent={false}
        animationType="fade"
        onRequestClose={toggleFullscreen}
      >
        {currentVideo && (
          <View style={[
            styles.fullscreenContainer,
            videoOrientation === 'horizontal' && styles.fullscreenContainerHorizontal
          ]}>
            <Video
              ref={videoRef}
              source={{ uri: currentVideo.videoUri }}
              style={[
                styles.fullscreenVideo,
                videoOrientation === 'horizontal' && styles.fullscreenVideoHorizontal
              ]}
              resizeMode={videoOrientation === 'horizontal' ? ResizeMode.COVER : ResizeMode.CONTAIN}
              isLooping={false}
              shouldPlay={!paused}
              useNativeControls
            />
            <TouchableOpacity
              style={styles.fullscreenCloseButton}
              onPress={toggleFullscreen}
            >
              <Ionicons name="close" size={32} color={colors.textLight} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.fullscreenOrientationButton}
              onPress={toggleVideoOrientation}
            >
              <Ionicons 
                name={videoOrientation === 'vertical' ? "phone-portrait-outline" : "phone-landscape-outline"} 
                size={28} 
                color={colors.textLight} 
              />
            </TouchableOpacity>
          </View>
        )}
      </Modal>

      {/* Report Modal */}
      <ReportModal
        visible={showReportModal}
        onClose={() => {
          setShowReportModal(false);
          setReportingVideo(null);
        }}
        onReport={handleReportVideo}
        videoTitle={reportingVideo?.name || 'this video'}
      />

      {/* Loading Modal */}
      <LoadingModal visible={loading} />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  categoryContainer: {
    paddingTop: 50,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  categoryScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.itemBackground,
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: colors.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },
  categoryButtonTextActive: {
    fontFamily: fonts.semiBold,
    color: colors.textLight,
  },
  pagerView: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
  },
  swipeContainer: {
    flex: 1,
    flexDirection: 'row',
    width: width * 2,
  },
  videoContainer: {
    width: width,
    height: height,
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    color: colors.textLight,
    flex: 1,
    marginLeft: 12,
  },
  headerSpacer: {
    width: 32,
  },
  userInfo: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: colors.textLight,
  },
  userName: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.textLight,
    marginRight: 8,
  },
  categoryTag: {
    backgroundColor: colors.light,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textLight,
  },
  caption: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textLight,
    marginTop: 8,
  },
  actionIcons: {
    position: 'absolute',
    right: 20,
    bottom: 130,
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 24,
  },
  actionCount: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textLight,
    marginTop: 4,
  },
  smallAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.textLight,
  },
  playPauseButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -30,
    marginLeft: -30,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    // padding: 10,
    // backgroundColor: 'rgba(0,0,0,0.6)',
    // borderRadius: 25,
    zIndex: 100,
    elevation: 5,
  },
  progressBarContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    zIndex: 200,
    paddingHorizontal: 0,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.textLight,
    borderRadius: 2,
  },
  vsPopup: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  vsPopupContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    fontSize: 32,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  detailsWrapper: {
    width: width,
    height: height,
    position: 'absolute',
    left: 0,
  },
  detailsContainer: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 50,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  closeButton: {
    padding: 4,
  },
  detailsContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  detailsUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailsAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  detailsUserText: {
    flex: 1,
  },
  detailsUserName: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 4,
  },
  detailsCategory: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  detailsCaption: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 24,
  },
  detailsStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.itemBackground,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  statText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text,
    marginLeft: 8,
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullscreenContainerHorizontal: {
    flexDirection: 'row',
  },
  fullscreenVideo: {
    width: '100%',
    height: '100%',
  },
  fullscreenVideoHorizontal: {
    width: '100%',
    height: '100%',
  },
  fullscreenCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    zIndex: 10,
  },
  fullscreenOrientationButton: {
    position: 'absolute',
    top: 50,
    right: 80,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    zIndex: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 40,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorText: {
    color: colors.textLight,
    fontSize: 16,
    fontFamily: fonts.regular,
  },
});

export default DiscoverScreen;
