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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import PagerView from 'react-native-pager-view';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import colors from '../../config/colors';
import fonts from '../../config/fonts';
import VSSvg from '../../assets/VS.svg';
import VoteSvg from '../../assets/vote.svg';
import FlashDiskSvg from '../../assets/discover/Flash Disk 2.svg';
import ShowSvg from '../../assets/discover/Show.svg';
import TimeCircleSvg from '../../assets/discover/Time Circle 4.svg';

const { width, height } = Dimensions.get('window');

// Battle data with 2 videos per battle
const battleData = [
  {
    id: 1,
    category: 'Singing',
    player1: {
      id: 1,
      name: 'Eva James',
      avatar: 'https://i.pravatar.cc/150?img=1',
      videoUri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      caption: 'Does a delight have a flavor? We think so...',
      stats: {
        saves: 234,
        views: 45,
        time: 45,
      },
    },
    player2: {
      id: 2,
      name: 'Sarah Williams',
      avatar: 'https://i.pravatar.cc/150?img=3',
      videoUri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      caption: 'New choreography is fire! 🔥',
      stats: {
        saves: 456,
        views: 78,
        time: 60,
      },
    },
  },
  {
    id: 2,
    category: 'Boxing',
    player1: {
      id: 3,
      name: 'Mike Johnson',
      avatar: 'https://i.pravatar.cc/150?img=2',
      videoUri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      caption: 'Training hard every day! 💪',
      stats: {
        saves: 189,
        views: 32,
        time: 30,
      },
    },
    player2: {
      id: 4,
      name: 'Alex Brown',
      avatar: 'https://i.pravatar.cc/150?img=4',
      videoUri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      caption: 'Perfecting my technique',
      stats: {
        saves: 312,
        views: 56,
        time: 45,
      },
    },
  },
  {
    id: 3,
    category: 'Dance',
    player1: {
      id: 5,
      name: 'Emma Davis',
      avatar: 'https://i.pravatar.cc/150?img=5',
      videoUri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      caption: 'Morning flow to start the day right',
      stats: {
        saves: 278,
        views: 41,
        time: 90,
      },
    },
    player2: {
      id: 6,
      name: 'Chris Lee',
      avatar: 'https://i.pravatar.cc/150?img=6',
      videoUri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
      caption: 'Training session with the team',
      stats: {
        saves: 523,
        views: 89,
        time: 120,
      },
    },
  },
];

const DiscoverScreen = ({ navigation }) => {
  const [currentBattleIndex, setCurrentBattleIndex] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState(1); // 1 or 2
  const [paused, setPaused] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showVSPopup, setShowVSPopup] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const pagerRef = useRef(null);
  const videoRef = useRef(null);
  const videoEndedRef = useRef(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const detailsTranslateX = useRef(new Animated.Value(width)).current;
  const vsPopupScale = useRef(new Animated.Value(0)).current;
  const vsPopupOpacity = useRef(new Animated.Value(0)).current;
  const vsPopupRotation = useRef(new Animated.Value(0)).current;

  const currentBattle = battleData[currentBattleIndex];
  const currentVideo = currentPlayer === 1 ? currentBattle.player1 : currentBattle.player2;

  useEffect(() => {
    // Reset when battle changes
    setCurrentPlayer(1);
    setVideoEnded(false);
    setShowVSPopup(false);
    setPaused(false);
    setVideoProgress(0);
    videoEndedRef.current = false;
  }, [currentBattleIndex]);

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
      ]).start();
      
      // After delay, animate out
      setTimeout(() => {
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
          // Switch to player 2
          setShowVSPopup(false);
          setCurrentPlayer(2);
          setPaused(false);
          setVideoEnded(false);
          setVideoProgress(0);
          videoEndedRef.current = false;
        });
      }, 2000);
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

  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
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
    const isActive = index === currentBattleIndex;
    const isPaused = paused && isActive;
    const video = currentPlayer === 1 ? battle.player1 : battle.player2;

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
            // Update progress (videos are limited to 5 seconds)
            if (
              status.isLoaded &&
              status.positionMillis !== undefined &&
              status.positionMillis !== null
            ) {
              const progress = Math.min(status.positionMillis / 5000, 1);
              setVideoProgress(progress);
            }
            // Limit video to 5 seconds
            if (
              status.isLoaded &&
              status.positionMillis >= 5000 &&
              !videoEndedRef.current
            ) {
              if (videoRef.current) {
                videoRef.current.pauseAsync();
              }
              handleVideoEnd();
            }
            // Also handle natural video end
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
              <Text style={styles.actionCount}>{video.stats.saves}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <ShowSvg width={28} height={28} />
              <Text style={styles.actionCount}>{video.stats.views}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <TimeCircleSvg width={28} height={28} />
              <Text style={styles.actionCount}>{video.stats.time}</Text>
            </TouchableOpacity>
            {/* <TouchableOpacity style={styles.actionButton}>
              <Image
                source={{ uri: video.avatar }}
                style={styles.smallAvatar}
              />
            </TouchableOpacity> */}
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
              <Text style={styles.statText}>{currentVideo.stats.saves} Saves</Text>
            </View>
            <View style={styles.statItem}>
              <ShowSvg width={20} height={20} />
              <Text style={styles.statText}>{currentVideo.stats.views} Views</Text>
            </View>
            <View style={styles.statItem}>
              <TimeCircleSvg width={20} height={20} />
              <Text style={styles.statText}>{currentVideo.stats.time}s Duration</Text>
            </View>
          </View>
        </ScrollView>
    </View>
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
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
        visible={fullscreen}
        transparent={false}
        animationType="fade"
        onRequestClose={toggleFullscreen}
      >
        <View style={styles.fullscreenContainer}>
          <Video
            ref={videoRef}
            source={{ uri: currentVideo.videoUri }}
            style={styles.fullscreenVideo}
            resizeMode={ResizeMode.CONTAIN}
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
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  fullscreenVideo: {
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
  },
});

export default DiscoverScreen;
