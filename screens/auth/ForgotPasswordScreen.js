import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import colors from '../../config/colors';
import fonts from '../../config/fonts';
import CustomTextInput from '../../components/CustomTextInput';
import CustomButton from '../../components/CustomButton';
import CustomHeader from '../../components/CustomHeader';
import LoadingModal from '../../components/LoadingModal';
import { resetPassword } from '../../services/authService';
import ForgotPasswordIllustration from '../../assets/forget-password.svg';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendResetLink = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      setSending(true);
      
      // Send Firebase password reset email
      await resetPassword(email.trim());
      
      Alert.alert(
        'Password Reset Email Sent',
        `A password reset link has been sent to ${email.trim()}.\n\nPlease check your email inbox and click the link to reset your password.`,
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
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.';
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
          title="Forget Password" 
          navigation={navigation}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Subtitle */}
          <View style={styles.subtitleContainer}>
            <Text style={styles.subtitle}>
              Enter your email. We'll send you a link — click it to reset your password.
            </Text>
          </View>

          {/* Illustration */}
          <View style={styles.illustrationContainer}>
            <ForgotPasswordIllustration width="100%" height={250} />
          </View>

          {/* Input Field */}
          <View style={styles.inputContainer}>
            <CustomTextInput
              label="Enter Your Email"
              placeholder="Enter Your Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          {/* Send Email Button */}
          <CustomButton
            text={sending ? "Sending Email..." : "Send Email"}
            onPress={handleSendResetLink}
            style={styles.sendButton}
            disabled={sending}
          />
        </ScrollView>

        {/* Loading Modal */}
        <LoadingModal visible={sending} />
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
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  subtitleContainer: {
    width: '100%',
    marginBottom: 30,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'left',
    lineHeight: 20,
  },
  illustrationContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 10,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 30,
  },
  sendButton: {
    marginTop: 10,
    backgroundColor: colors.primary,
  },
});

export default ForgotPasswordScreen;

