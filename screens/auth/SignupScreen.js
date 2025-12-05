import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import colors from '../../config/colors';
import fonts from '../../config/fonts';
import CustomTextInput from '../../components/CustomTextInput';
import PasswordInput from '../../components/PasswordInput';
import CustomButton from '../../components/CustomButton';
import SocialButton from '../../components/SocialButton';
import Checkbox from '../../components/Checkbox';
import LoadingModal from '../../components/LoadingModal';
import { registerUser, sendVerificationEmail } from '../../services/authService';

const SignupScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter a password');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (!acceptTerms) {
      Alert.alert('Error', 'Please accept Terms & Conditions');
      return;
    }

    setLoading(true);
    try {
      console.log('📝 Starting user registration...');
      const userCredential = await registerUser(email.trim(), password);
      console.log('✅ User registered in Firebase Auth:', userCredential.user.uid);
      
      // Send verification email
      try {
        await sendVerificationEmail();
        console.log('✅ Verification email sent');
      } catch (verificationError) {
        console.log('⚠️ Verification email error:', verificationError);
        // Continue even if verification email fails
      }

      // Navigate to profile creation
      console.log('📝 Navigating to ProfileCreation...');
      navigation.replace('ProfileCreation', {
        userId: userCredential.user.uid,
        email: userCredential.user.email,
      });
    } catch (error) {
      console.error('Signup Error:', error);
      let errorMessage = 'Sign up failed. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please login instead.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Sign Up Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleGoogleSignUp = () => {
    Alert.alert('Coming Soon', 'Google Sign-Up will be available soon.');
  };

  const handleFacebookSignUp = () => {
    Alert.alert('Coming Soon', 'Facebook Sign-Up will be available soon.');
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
        {/* Logo */}
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Title and Subtitle */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Sign Up</Text>
          <Text style={styles.subtitle}>Join our community and experience The battle with your Friends.</Text>
        </View>

        {/* Social Login Buttons */}
        <View style={styles.socialContainer}>
          <SocialButton
            icon={
              <Image
                source={require('../../assets/google.png')}
                style={styles.socialIcon}
                resizeMode="contain"
              />
            }
            text="Google"
            onPress={handleGoogleSignUp}
            style={styles.socialButton}
            disabled={loading}
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
            onPress={handleFacebookSignUp}
            style={styles.socialButton}
            disabled={loading}
          />
        </View>

        {/* Input Fields */}
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

          <PasswordInput
            label="Confirm Password"
            placeholder="Enter Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>

        {/* Terms & Conditions Checkbox */}
        <View style={styles.checkboxContainer}>
          <Checkbox
            checked={acceptTerms}
            onPress={() => setAcceptTerms(!acceptTerms)}
          />
          <Text style={styles.checkboxText}>I accept Terms & Conditions</Text>
        </View>

        {/* Sign Up Button */}
        <CustomButton
          text={loading ? 'Creating Account...' : 'Sign Up'}
          onPress={handleSignUp}
          style={styles.signUpButton}
          disabled={loading}
        />

        {/* Login Link */}
        <View style={styles.loginLinkContainer}>
          <Text style={styles.loginLinkText}>Already have an account? </Text>
          <TouchableOpacity onPress={handleLogin}>
            <Text style={styles.loginLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Loading Modal */}
      <LoadingModal visible={loading} />
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
    paddingBottom: 40,
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
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  checkboxText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 10,
  },
  signUpButton: {
    marginBottom: 20,
    backgroundColor: colors.primary,
  },
  loginLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginLinkText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  loginLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
});

export default SignupScreen;

