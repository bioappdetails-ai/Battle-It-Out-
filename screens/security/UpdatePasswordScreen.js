import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import colors from '../../config/colors';
import fonts from '../../config/fonts';
import PasswordInput from '../../components/PasswordInput';
import CustomButton from '../../components/CustomButton';
import CustomHeader from '../../components/CustomHeader';
import LoadingModal from '../../components/LoadingModal';
import { getCurrentUser, resetPassword, reauthenticateUser } from '../../services/authService';

const UpdatePasswordScreen = ({ navigation }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [sending, setSending] = useState(false);

  const handleUpdate = async () => {
    if (!currentPassword.trim()) {
      Alert.alert('Error', 'Please enter your current password');
      return;
    }

    try {
      setSending(true);
      const currentUser = getCurrentUser();
      if (!currentUser || !currentUser.email) {
        Alert.alert('Error', 'User not found');
        return;
      }

      // Verify current password by reauthenticating
      await reauthenticateUser(currentUser.email, currentPassword);

      // Send Firebase password reset email
      await resetPassword(currentUser.email);
      
      Alert.alert(
        'Password Reset Email Sent',
        `A password reset link has been sent to ${currentUser.email}.\n\nPlease check your email inbox and click the link to reset your password.`,
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error sending password reset email:', error);
      let errorMessage = 'Failed to send password reset email. Please try again.';
      
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect current password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
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
          title="Update Password" 
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
              Enter your current password to receive a password reset link via email.
            </Text>
          </View>

          {/* Input Fields */}
          <View style={styles.inputContainer}>
            <PasswordInput
              label="Enter Your Current Password"
              placeholder="Enter Your Current Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
          </View>

          {/* Update Button */}
          <CustomButton
            text={sending ? "Sending Email..." : "Send Reset Link"}
            onPress={handleUpdate}
            style={styles.updateButton}
            disabled={sending}
          />
        </ScrollView>
      </View>
      
      {/* Loading Modal */}
      <LoadingModal visible={sending} />
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
});

export default UpdatePasswordScreen;

