import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../config/colors';
import fonts from '../../config/fonts';
import CodeInput from '../../components/CodeInput';
import CustomButton from '../../components/CustomButton';
import CustomHeader from '../../components/CustomHeader';
import { getCurrentUser, signOutUser } from '../../services/authService';
import { verifyOTP } from '../../services/otpService';
import { updateDocument, COLLECTIONS } from '../../services/firestoreService';

const BlockAccountVerificationScreen = ({ navigation, route }) => {
  const { reason } = route.params || {};
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.email) {
      setUserEmail(currentUser.email);
    }
  }, []);

  const handleVerify = async () => {
    if (code.length !== 4) {
      Alert.alert('Error', 'Please enter the complete 4-digit code');
      return;
    }

    try {
      setVerifying(true);
      const currentUser = getCurrentUser();
      if (!currentUser || !currentUser.email) {
        Alert.alert('Error', 'User not found');
        return;
      }

      const isValid = await verifyOTP(currentUser.email, code, 'block_account');
      
      if (isValid) {
        // OTP verified, proceed with account blocking
        try {
          // Update user document to set blocked=true and blockReason
          await updateDocument(COLLECTIONS.USERS, currentUser.uid, {
            blocked: true,
            blockReason: reason || 'User requested account blocking',
            blockedAt: new Date().toISOString(),
          });
          
          Alert.alert(
            'Account Blocked',
            'Your account has been blocked successfully.',
            [
              {
                text: 'OK',
                onPress: async () => {
                  try {
                    // Sign out user
                    await signOutUser();
                    navigation.replace('Login');
                  } catch (error) {
                    console.error('Error signing out:', error);
                    navigation.replace('Login');
                  }
                }
              }
            ]
          );
        } catch (error) {
          console.error('Error blocking account:', error);
          Alert.alert('Error', 'Failed to block account. Please try again.');
        }
      } else {
        Alert.alert('Error', 'Invalid verification code. Please try again.');
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
          We have sent the verification code to your registered email address
        </Text>

        {/* Verification Image */}
        <Image
          source={require('../../assets/verification.png')}
          style={styles.verificationImage}
          resizeMode="contain"
        />

        {/* Code Input Fields */}
        <View style={styles.codeContainer}>
          <CodeInput
            length={4}
            value={code}
            onCodeChange={setCode}
          />
        </View>

        {/* Verify Button */}
        <CustomButton
          text={verifying ? "Verifying..." : "Verify"}
          onPress={handleVerify}
          style={styles.verifyButton}
          disabled={verifying || code.length !== 4}
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

export default BlockAccountVerificationScreen;


