import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  sendEmailVerification,
  verifyBeforeUpdateEmail,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { Platform } from 'react-native';
import { auth } from './firebase';
import { generateUserId } from '../utils/uuid';
import { saveAuthUserId, clearAuthUserId } from './storageService';

// Dynamically import Google Sign-In to handle cases where native module isn't available
let GoogleSignin = null;
let statusCodes = null;

try {
  const googleSignInModule = require('@react-native-google-signin/google-signin');
  GoogleSignin = googleSignInModule.GoogleSignin;
  statusCodes = googleSignInModule.statusCodes;
  
  // Configure Google Sign In only if module is available
  if (GoogleSignin) {
    GoogleSignin.configure({
      webClientId: '907613423588-hpi2gjdqkoq8ldr4lv9q8v4ilsi43rkp.apps.googleusercontent.com', // Web client ID from Firebase
      offlineAccess: true, // If you want to access Google API on behalf of the user FROM YOUR SERVER
      hostedDomain: '', // specifies a hosted domain restriction
      forceCodeForRefreshToken: true, // [Android] related to `serverAuthCode`, read the docs link below *.
    });
  }
} catch (error) {
  console.warn('⚠️ Google Sign-In native module not available. This requires a development build:', error.message);
}

/**
 * Authentication Service
 * Handles all authentication-related operations
 */

/**
 * Register a new user with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<UserCredential>}
 */
export const registerUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Save user ID to AsyncStorage for persistence
    if (userCredential.user) {
      await saveAuthUserId(userCredential.user.uid);
    }
    return userCredential;
  } catch (error) {
    throw error;
  }
};

/**
 * Sign in an existing user
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<UserCredential>}
 */
export const signInUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // Save user ID to AsyncStorage for persistence
    if (userCredential.user) {
      await saveAuthUserId(userCredential.user.uid);
    }
    return userCredential;
  } catch (error) {
    throw error;
  }
};

/**
 * Sign out the current user
 * @returns {Promise<void>}
 */
export const signOutUser = async () => {
  try {
    await signOut(auth);
    // Clear user ID from AsyncStorage
    await clearAuthUserId();
  } catch (error) {
    throw error;
  }
};

/**
 * Send password reset email
 * @param {string} email - User's email
 * @returns {Promise<void>}
 */
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw error;
  }
};

/**
 * Update user's display name and photo URL
 * @param {string} displayName - User's display name
 * @param {string} photoURL - User's photo URL
 * @returns {Promise<void>}
 */
export const updateUserProfile = async (displayName, photoURL) => {
  try {
    await updateProfile(auth.currentUser, {
      displayName,
      photoURL,
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Update user's email
 * @param {string} newEmail - New email address
 * @returns {Promise<void>}
 */
export const updateUserEmail = async (newEmail) => {
  try {
    await updateEmail(auth.currentUser, newEmail);
  } catch (error) {
    throw error;
  }
};

/**
 * Send email verification
 * @returns {Promise<void>}
 */
export const sendVerificationEmail = async () => {
  try {
    await sendEmailVerification(auth.currentUser);
  } catch (error) {
    throw error;
  }
};

/**
 * Verify and update email (sends verification to new email)
 * @param {string} newEmail - New email address
 * @returns {Promise<void>}
 */
export const verifyBeforeUpdateEmailAddress = async (newEmail) => {
  try {
    await verifyBeforeUpdateEmail(auth.currentUser, newEmail);
  } catch (error) {
    throw error;
  }
};

/**
 * Re-authenticate user with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<void>}
 */
export const reauthenticateUser = async (email, password) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in');
    }
    const credential = EmailAuthProvider.credential(email, password);
    await reauthenticateWithCredential(user, credential);
  } catch (error) {
    throw error;
  }
};

/**
 * Get current authenticated user
 * @returns {User|null}
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Listen to authentication state changes
 * @param {Function} callback - Callback function that receives the user object
 * @returns {Function} Unsubscribe function
 */
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Sign in with Google using @react-native-google-signin/google-signin
 * @returns {Promise<UserCredential>}
 */
export const signInWithGoogle = async () => {
  try {
    // Check if Google Sign-In module is available
    if (!GoogleSignin) {
      throw new Error(
        'Google Sign-In is not available. Please rebuild the app with:\n' +
        '1. npx expo prebuild\n' +
        '2. npx expo run:ios (or npx expo run:android)\n\n' +
        'Google Sign-In requires native code and cannot run in Expo Go.'
      );
    }

    console.log('🔐 Starting Google Sign-In...');
    console.log('📱 Platform:', Platform.OS);
    
    // Check if Google Play Services are available (Android only)
    if (Platform.OS === 'android') {
      console.log('📱 Checking Google Play Services...');
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      console.log('✅ Google Play Services available');
    }
    
    console.log('🌐 Prompting for Google authentication...');
    // Sign in with Google
    const userInfo = await GoogleSignin.signIn();
    
    console.log('📊 Google Sign-In response received');
    console.log('📋 Response structure:', JSON.stringify(userInfo, null, 2));
    
    if (!userInfo) {
      throw new Error('No response received from Google Sign-In');
    }
    
    // Get the ID token - it can be directly on userInfo or in userInfo.data
    const idToken = userInfo.idToken || userInfo.data?.idToken;
    
    if (!idToken) {
      console.error('❌ No ID token in response');
      console.error('📋 Available keys:', Object.keys(userInfo));
      throw new Error('No ID token received from Google');
    }
    
    console.log('✅ ID token received, creating Firebase credential...');
    
    // Create Firebase credential with the ID token
    const googleCredential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, googleCredential);
    
    console.log('✅ Firebase authentication successful');
    console.log('👤 User:', userCredential.user.email);
    
    // Save user ID to AsyncStorage for persistence
    if (userCredential.user) {
      await saveAuthUserId(userCredential.user.uid);
      console.log('💾 User ID saved to storage');
    }
    
    return userCredential;
  } catch (error) {
    console.error('❌ Google Sign-In Error:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    
    // Handle specific error codes (if statusCodes is available)
    if (statusCodes) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('🚫 User cancelled sign-in');
        throw new Error('Sign-In cancelled by user');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('⏳ Sign-in already in progress');
        throw new Error('Sign-in is already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log('📱 Play services not available');
        throw new Error('Google Play Services not available. Please update Google Play Services.');
      }
    }
    
    // Re-throw with more context if needed
    if (error.message) {
      throw error;
    } else {
      throw new Error('Google Sign-In failed. Please try again.');
    }
  }
};

export default {
  registerUser,
  signInUser,
  signOutUser,
  resetPassword,
  updateUserProfile,
  updateUserEmail,
  sendVerificationEmail,
  getCurrentUser,
  onAuthStateChange,
  signInWithGoogle,
};

