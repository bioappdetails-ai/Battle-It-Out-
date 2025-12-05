import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import colors from '../../config/colors';
import fonts from '../../config/fonts';
import CustomTextInput from '../../components/CustomTextInput';
import PasswordInput from '../../components/PasswordInput';
import CustomButton from '../../components/CustomButton';
import SocialButton from '../../components/SocialButton';
import { signInUser, signInWithGoogle, getCurrentUser, signOutUser } from '../../services/authService';
import { getDocument } from '../../services/firestoreService';
import { COLLECTIONS } from '../../services/firestoreService';
import LoadingModal from '../../components/LoadingModal';
const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const checkInternetConnection = async () => {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected && netInfo.isInternetReachable;
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    const isConnected = await checkInternetConnection();
    if (!isConnected) {
      Alert.alert('No Internet Connection', 'Please check your internet connection and try again.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInUser(email, password);
      const userProfile = await getDocument(COLLECTIONS.USERS, userCredential.user.uid);
      
      if (userProfile && userProfile.blocked === true) {
        await signOutUser();
        Alert.alert(
          'Account Blocked',
          userProfile.blockReason || 'Your account has been blocked. Please contact support for assistance.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      if (userProfile && userProfile.displayName) {
        navigation.replace('Main');
      } else {
        navigation.replace('ProfileCreation', {
          userId: userCredential.user.uid,
          email: userCredential.user.email,
        });
      }
    } catch (error) {
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect email or password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Login Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    navigation.navigate('Signup');
  };

  const handleForgotPassword = () => {
    if (navigation && navigation.navigate) {
      navigation.navigate('ForgotPassword');
    }
  };

  const handleGoogleLogin = async () => {
    const isConnected = await checkInternetConnection();
    if (!isConnected) {
      Alert.alert('No Internet Connection', 'Please check your internet connection and try again.');
      return;
    }

    setGoogleLoading(true);
    try {
      const userCredential = await signInWithGoogle();
      const userProfile = await getDocument(COLLECTIONS.USERS, userCredential.user.uid);
      
      if (userProfile && userProfile.blocked === true) {
        await signOutUser();
        Alert.alert(
          'Account Blocked',
          userProfile.blockReason || 'Your account has been blocked. Please contact support for assistance.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      navigation.replace('Main');
    } catch (error) {
      let errorMessage = 'Google Sign-In failed. Please try again.';
      
      if (error.message && error.message.includes('cancelled')) {
        return;
      }
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Google Sign-In Error', errorMessage);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleFacebookLogin = () => {
    Alert.alert('Coming Soon', 'Facebook Sign-In will be available soon.');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.titleContainer}>
          <Text style={styles.title}>Login</Text>
          <Text style={styles.subtitle}>Login and compete and get Fame.</Text>
        </View>

        <View style={styles.inputContainer}>
          <CustomTextInput
            label="Email Address"
            placeholder="Enter Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <PasswordInput
            label="Password"
            placeholder="Enter Password"
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <View style={styles.socialContainer}>
          <SocialButton
            icon={
              googleLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Image
                  source={require('../../assets/google.png')}
                  style={styles.socialIcon}
                  resizeMode="contain"
                />
              )
            }
            text={googleLoading ? 'Signing in...' : 'Google'}
            onPress={handleGoogleLogin}
            style={styles.socialButton}
            disabled={googleLoading || loading}
          />
          <View style={styles.socialSpacer} />
          <SocialButton
            icon={
              <Image
                source={require('../../assets/fb.png')}
                style={styles.socialIcon}
                resizeMode="contain"
              />
            }
            text="Facebook"
            onPress={handleFacebookLogin}
            style={styles.socialButton}
            disabled={googleLoading || loading}
          />
        </View>

        <CustomButton
          text={loading ? 'Logging in...' : 'Login'}
          onPress={handleLogin}
          style={styles.loginButton}
          disabled={loading || googleLoading}
        />

        <CustomButton
          text="Sign Up"
          onPress={handleSignUp}
          style={styles.signUpButton}
        />

        <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPasswordContainer}>
          <Text style={styles.forgotPasswordText}>Forget Password?</Text>
        </TouchableOpacity>
      </ScrollView>

      <LoadingModal visible={loading || googleLoading} />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 100,
    paddingBottom: 20,
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 100,
    marginBottom: 30,
  },
  titleContainer: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  title: {
    fontSize: 37,
    fontFamily: fonts.medium,
    color: colors.secondary,
    marginBottom: 8,
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'left',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  socialContainer: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 20,
  },
  socialButton: {
    flex: 1,
  },
  socialSpacer: {
    width: 12,
  },
  socialIcon: {
    width: 20,
    height: 20,
  },
  loginButton: {
    marginBottom: 12,
    backgroundColor: colors.primary,
  },
  signUpButton: {
    marginBottom: 20,
    backgroundColor: colors.secondary,
  },
  forgotPasswordContainer: {
    marginTop: 10,
  },
  forgotPasswordText: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default LoginScreen;

