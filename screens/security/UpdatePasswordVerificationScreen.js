import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../config/colors';
import fonts from '../../config/fonts';
import CodeInput from '../../components/CodeInput';
import CustomButton from '../../components/CustomButton';
import CustomHeader from '../../components/CustomHeader';
import { getCurrentUser } from '../../services/authService';
import { updatePassword, reload } from 'firebase/auth';

const UpdatePasswordVerificationScreen = ({ navigation, route }) => {
  const { currentPassword, newPassword } = route.params || {};
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleNext = async () => {
    try {
      setVerifying(true);
      const currentUser = getCurrentUser();
      if (!currentUser || !currentUser.email) {
        Alert.alert('Error', 'User not found');
        return;
      }

      // Reload user to check if email is verified
      await reload(currentUser);
      const updatedUser = getCurrentUser();
      
      if (updatedUser && updatedUser.emailVerified) {
        // Email verified, update password
        try {
          await updatePassword(updatedUser, newPassword);
          Alert.alert('Success', 'Your password has been updated successfully!', [
            { text: 'OK', onPress: () => navigation.navigate('Security') }
          ]);
        } catch (error) {
          console.error('Error updating password:', error);
          if (error.code === 'auth/requires-recent-login') {
            Alert.alert('Error', 'Please log out and log back in before changing your password.');
          } else {
            Alert.alert('Error', 'Failed to update password. Please try again.');
          }
        }
      } else {
        Alert.alert('Error', 'Please verify your email by clicking the link sent to your inbox, then try again.');
        setCode('');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      Alert.alert('Error', 'Failed to verify code. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
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
        {/* Header with Back Button */}
        <CustomHeader 
          title="Verification Code" 
          navigation={navigation}
          onBackPress={handleBack}
        />

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Please verify your email by clicking the link sent to your inbox, then click Verify below.
        </Text>

        {/* Verification Image */}
        <Image
          source={require('../../assets/verification.png')}
          style={styles.verificationImage}
          resizeMode="contain"
        />

        {/* Verify Button */}
        <CustomButton
          text={verifying ? "Verifying..." : "Verify Email & Update Password"}
          onPress={handleNext}
          style={styles.verifyButton}
          disabled={verifying}
        />
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
    paddingTop: 20,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "left",
    marginBottom: 40,
  },
  verificationImage: {
    width: "100%",
    height: 250,
    marginBottom: 40,
  },
  codeContainer: {
    marginBottom: 40,
    alignItems: "center",
  },
  verifyButton: {
    backgroundColor: colors.primary,
  },
});

export default UpdatePasswordVerificationScreen;

