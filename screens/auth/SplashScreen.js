import React, { useEffect, useRef, useState } from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import colors from '../../config/colors';
import { getCurrentUser, signOutUser, onAuthStateChange } from '../../services/authService';
import { getDocument } from '../../services/firestoreService';
import { COLLECTIONS } from '../../services/firestoreService';
import { getAuthUserId } from '../../services/storageService';

const SplashScreen = ({ navigation }) => {
  const videoRef = useRef(null);
  const [videoEnded, setVideoEnded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  // You can replace this with your splash video URL or local file
  // For local file: require('../../assets/splash-video.mp4')
  // For remote URL: 'https://your-video-url.com/splash.mp4'
  const splashVideoSource = null; // Set to your video source or null to use image fallback

  // Handle image fallback timer (when no video is provided)
  useEffect(() => {
    if (!splashVideoSource) {
      // Simulate video duration for image fallback
      const timer = setTimeout(() => {
        handleVideoEnd();
      }, 3000); // 3 seconds for image fallback
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    // Listen to Firebase auth state changes to ensure persistence
    const unsubscribe = onAuthStateChange(async (user) => {
      try {
        // Also check AsyncStorage for user ID persistence
        const storedUserId = await getAuthUserId();
        
        if (user) {
          // Verify stored user ID matches current user
          if (storedUserId && storedUserId !== user.uid) {
            console.warn('⚠️ Stored user ID mismatch, clearing...');
            // This shouldn't happen, but handle it gracefully
          }
          
          // User is logged in, check if profile exists
          const userProfile = await getDocument(COLLECTIONS.USERS, user.uid);
          
          // Check if user is blocked
          if (userProfile && userProfile.blocked === true) {
            // User is blocked, sign out and go to login
            await signOutUser();
            setHasCheckedAuth(true);
            if (videoEnded) {
              navigation.replace('Login');
            }
            return;
          }
          
          setHasCheckedAuth(true);
          // Wait for video to finish before navigating
          if (videoEnded) {
            if (userProfile && userProfile.displayName) {
              // Profile exists, go to main app
              navigation.replace('Main');
            } else {
              // Profile not complete, go to profile creation
              navigation.replace('ProfileCreation', {
                userId: user.uid,
                email: user.email,
              });
            }
          }
        } else {
          // No user, check if we have a stored user ID (shouldn't happen, but verify)
          if (storedUserId) {
            console.warn('⚠️ Firebase user is null but AsyncStorage has user ID');
          }
          // No user, go to login
          setHasCheckedAuth(true);
          if (videoEnded) {
            navigation.replace('Login');
          }
        }
      } catch (error) {
        console.error('Splash screen error:', error);
        // On error, go to login
        setHasCheckedAuth(true);
        if (videoEnded) {
          navigation.replace('Login');
        }
      }
    });

    return unsubscribe; // Cleanup subscription
  }, [navigation, videoEnded]);

  // Handle image fallback timer (when no video is provided)
  useEffect(() => {
    if (!splashVideoSource) {
      // Simulate video duration for image fallback
      const timer = setTimeout(() => {
        handleVideoEnd();
      }, 3000); // 3 seconds for image fallback
      return () => clearTimeout(timer);
    }
  }, []);

  // Handle video end and navigation
  useEffect(() => {
    if (videoEnded && hasCheckedAuth) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        const user = getCurrentUser();
        
        if (user) {
          // Re-check to navigate (in case auth check completed before video ended)
          getDocument(COLLECTIONS.USERS, user.uid)
            .then((userProfile) => {
              if (userProfile && userProfile.blocked === true) {
                signOutUser().then(() => {
                  navigation.replace('Login');
                });
              } else if (userProfile && userProfile.displayName) {
                navigation.replace('Main');
              } else {
                navigation.replace('ProfileCreation', {
                  userId: user.uid,
                  email: user.email,
                });
              }
            })
            .catch(() => {
              navigation.replace('Login');
            });
        } else {
          navigation.replace('Login');
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [videoEnded, hasCheckedAuth, navigation]);

  const handleVideoLoad = () => {
    setIsLoading(false);
  };

  const handleVideoEnd = () => {
    setVideoEnded(true);
  };

  const handleVideoError = (error) => {
    console.error('Splash video error:', error);
    setIsLoading(false);
    // If video fails, proceed with navigation after a short delay
    setTimeout(() => {
      setVideoEnded(true);
    }, 1000);
  };

  return (
    <View style={styles.container}>
      {/* Video or Image Content */}
      <View style={styles.contentContainer}>
        {splashVideoSource ? (
          <Video
            ref={videoRef}
            source={typeof splashVideoSource === 'string' ? { uri: splashVideoSource } : splashVideoSource}
            style={styles.video}
            resizeMode={ResizeMode.COVER}
            shouldPlay={true}
            isLooping={false}
            isMuted={false}
            onLoad={handleVideoLoad}
            onPlaybackStatusUpdate={(status) => {
              if (status.didJustFinish && !status.isLooping) {
                handleVideoEnd();
              }
            }}
            onError={handleVideoError}
          />
        ) : (
          // Fallback to image if no video
          <View style={styles.imageContainer}>
            <Image 
              source={require('../../assets/splash icon.png')} 
              style={styles.logo}
              resizeMode="contain"
              onLoad={handleVideoLoad}
            />
          </View>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.secondary} />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  imageContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 280,
    height: 280,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SplashScreen;

