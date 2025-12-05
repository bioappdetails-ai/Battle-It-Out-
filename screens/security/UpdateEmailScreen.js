import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../config/colors';
import fonts from '../../config/fonts';
import CustomTextInput from '../../components/CustomTextInput';
import PasswordInput from '../../components/PasswordInput';
import CustomButton from '../../components/CustomButton';
import CustomHeader from '../../components/CustomHeader';
import { getCurrentUser, reauthenticateUser, verifyBeforeUpdateEmailAddress } from '../../services/authService';

const UpdateEmailScreen = ({ navigation }) => {
  const [password, setPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [step, setStep] = useState('password'); // 'password' or 'email'
  const [verifying, setVerifying] = useState(false);
  const [sending, setSending] = useState(false);

  const handleVerifyPassword = async () => {
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    try {
      setVerifying(true);
      const currentUser = getCurrentUser();
      if (!currentUser || !currentUser.email) {
        Alert.alert('Error', 'User not found');
        return;
      }

      // Re-authenticate user with password to verify
      await reauthenticateUser(currentUser.email, password);
      
      // Password verified, move to email step
      setStep('email');
    } catch (error) {
      console.error('Error verifying password:', error);
      if (error.code === 'auth/wrong-password') {
        Alert.alert('Error', 'Incorrect password. Please try again.');
      } else if (error.code === 'auth/invalid-credential') {
        Alert.alert('Error', 'Invalid password. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to verify password. Please try again.');
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleSendVerification = async () => {
    if (!newEmail.trim()) {
      Alert.alert('Error', 'Please enter a new email');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      setSending(true);
      const currentUser = getCurrentUser();
      if (!currentUser) {
        Alert.alert('Error', 'User not found');
        return;
      }

      // Check if new email is different from current
      if (newEmail.trim().toLowerCase() === currentUser.email?.toLowerCase()) {
        Alert.alert('Error', 'New email must be different from current email');
        return;
      }

      // Use Firebase's verifyBeforeUpdateEmail to send verification to new email
      await verifyBeforeUpdateEmailAddress(newEmail.trim());
      
      Alert.alert(
        'Verification Email Sent',
        `A verification email has been sent to ${newEmail}.\n\nPlease check your email inbox and click the verification link to confirm the email change. Once verified, return to the app.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to verification screen with email data
              navigation.navigate('UpdateEmailVerification', {
                newEmail: newEmail.trim(),
              });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error sending verification:', error);
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Error', 'This email is already in use by another account.');
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert('Error', 'Invalid email address. Please enter a valid email.');
      } else {
        Alert.alert('Error', error.message || 'Failed to send verification email. Please try again.');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        {/* Header */}
        <CustomHeader 
          title="Update Email" 
          navigation={navigation}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title and Subtitle */}
          <View style={styles.titleContainer}>
            <Text style={styles.subtitle}>
              {step === 'password' 
                ? 'Please enter your current password to verify your identity.'
                : 'Enter your new email address. A verification email will be sent to the new email.'}
            </Text>
          </View>

          {/* Input Fields */}
          <View style={styles.inputContainer}>
            {step === 'password' ? (
              <PasswordInput
                label="Enter Your Current Password"
                placeholder="Enter Your Current Password"
                value={password}
                onChangeText={setPassword}
              />
            ) : (
              <CustomTextInput
                label="Enter Your New Email"
                placeholder="Enter Your New Email"
                value={newEmail}
                onChangeText={setNewEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          </View>

          {/* Action Button */}
          {step === 'password' ? (
            <CustomButton
              text={verifying ? "Verifying..." : "Verify Password"}
              onPress={handleVerifyPassword}
              style={styles.updateButton}
              disabled={verifying}
            />
          ) : (
            <>
              <TouchableOpacity 
                onPress={() => setStep('password')}
                style={styles.backButton}
              >
                <Text style={styles.backButtonText}>← Back to Password</Text>
              </TouchableOpacity>
              <CustomButton
                text={sending ? "Sending..." : "Send Verification Email"}
                onPress={handleSendVerification}
                style={styles.updateButton}
                disabled={sending}
              />
            </>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
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
  updateButton: {
    marginTop: 10,
  },
  backButton: {
    marginTop: 20,
    marginBottom: 10,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.primary,
  },
});

export default UpdateEmailScreen;

