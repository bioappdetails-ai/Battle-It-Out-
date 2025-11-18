import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import colors from '../../config/colors';
import fonts from '../../config/fonts';
import CustomTextInput from '../../components/CustomTextInput';
import PasswordInput from '../../components/PasswordInput';
import CustomButton from '../../components/CustomButton';
import SocialButton from '../../components/SocialButton';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Handle login logic here
    console.log('Login:', { email, password });
    navigation.replace('Main');
  };

  const handleSignUp = () => {
    navigation.navigate('Signup');
  };

  const handleForgotPassword = () => {
    // Handle forgot password logic here
    console.log('Forgot Password');
  };

  const handleGoogleLogin = () => {
    // Handle Google login logic here
    console.log('Google Login');
  };

  const handleFacebookLogin = () => {
    // Handle Facebook login logic here
    console.log('Facebook Login');
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
          <Text style={styles.title}>Login</Text>
          <Text style={styles.subtitle}>Login and compete and get Fame.</Text>
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
            onPress={handleGoogleLogin}
            style={styles.socialButton}
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
          />
        </View>

        {/* Login Button */}
        <CustomButton
          text="Login"
          onPress={handleLogin}
          style={styles.loginButton}
        />

        {/* Sign Up Button */}
        <CustomButton
          text="Sign Up"
          onPress={handleSignUp}
          style={styles.signUpButton}
        />

        {/* Forgot Password Link */}
        <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPasswordContainer}>
          <Text style={styles.forgotPasswordText}>Forget Password?</Text>
        </TouchableOpacity>
      </ScrollView>
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

