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
  
  if (GoogleSignin) {
    GoogleSignin.configure({
      webClientId: '907613423588-hpi2gjdqkoq8ldr4lv9q8v4ilsi43rkp.apps.googleusercontent.com',
      offlineAccess: true,
      hostedDomain: '',
      forceCodeForRefreshToken: true,
    });
  }
} catch (error) {
}

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

export const signOutUser = async () => {
  try {
    await signOut(auth);
    await clearAuthUserId();
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw error;
  }
};

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

export const updateUserEmail = async (newEmail) => {
  try {
    await updateEmail(auth.currentUser, newEmail);
  } catch (error) {
    throw error;
  }
};

export const sendVerificationEmail = async () => {
  try {
    await sendEmailVerification(auth.currentUser);
  } catch (error) {
    throw error;
  }
};

export const verifyBeforeUpdateEmailAddress = async (newEmail) => {
  try {
    await verifyBeforeUpdateEmail(auth.currentUser, newEmail);
  } catch (error) {
    throw error;
  }
};

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

export const getCurrentUser = () => {
  return auth.currentUser;
};

export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export const signInWithGoogle = async () => {
  try {
    if (!GoogleSignin) {
      throw new Error(
        'Google Sign-In is not available. Please rebuild the app with:\n' +
        '1. npx expo prebuild\n' +
        '2. npx expo run:ios (or npx expo run:android)\n\n' +
        'Google Sign-In requires native code and cannot run in Expo Go.'
      );
    }

    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }
    
    await GoogleSignin.signOut();
    
    const userInfo = await GoogleSignin.signIn();
    
    if (!userInfo) {
      throw new Error('No response received from Google Sign-In');
    }
    
    const idToken = userInfo.idToken || userInfo.data?.idToken;
    
    if (!idToken) {
      throw new Error('No ID token received from Google');
    }
    
    const googleCredential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, googleCredential);
    
    if (userCredential.user) {
      await saveAuthUserId(userCredential.user.uid);
    }
    
    return userCredential;
  } catch (error) {
    if (statusCodes) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error('Sign-In cancelled by user');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error('Sign-in is already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services not available. Please update Google Play Services.');
      }
    }
    
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

