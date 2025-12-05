import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../config/colors';
import fonts from '../../config/fonts';
import CodeInput from '../../components/CodeInput';
import CustomButton from '../../components/CustomButton';
import CustomHeader from '../../components/CustomHeader';
import { getCurrentUser } from '../../services/authService';
import { updateDocument, COLLECTIONS } from '../../services/firestoreService';
import { reload } from 'firebase/auth';

const UpdateEmailVerificationScreen = ({ navigation, route }) => {
  const { newEmail } = route.params || {};
  const [verifying, setVerifying] = useState(false);

  const handleNext = async () => {
    try {
      setVerifying(true);
      
      if (!newEmail) {
        Alert.alert('Error', 'Email information missing');
        return;
      }

      const currentUser = getCurrentUser();
      if (!currentUser) {
        Alert.alert('Error', 'User not found');
        return;
      }

      // Reload user to check if email has been updated
      // When user clicks the verification link, Firebase automatically updates the email
      await reload(currentUser);
      const updatedUser = getCurrentUser();
      
      // Check if email has been updated to the new email
      if (updatedUser && updatedUser.email === newEmail) {
        // Email has been updated by Firebase, now update Firestore
        try {
          // Update email in Firestore user document
          await updateDocument(COLLECTIONS.USERS, updatedUser.uid, {
            email: newEmail,
          });

          Alert.alert('Success', 'Your email has been updated successfully!', [
            { text: 'OK', onPress: () => navigation.navigate('Security') }
          ]);
        } catch (error) {
          console.error('Error updating email in Firestore:', error);
          Alert.alert('Error', 'Email updated in authentication but failed to update in database. Please contact support.');
        }
      } else {
        Alert.alert(
          'Email Not Verified Yet',
          'Please check your email inbox and click the verification link sent to ' + newEmail + '. Once you click the link, return here and click Verify again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error verifying email:', error);
      Alert.alert('Error', 'Failed to verify email. Please try again.');
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
      behavior={Platform.OS === "ios" ? "padding" : "height"}
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
          A verification email has been sent to{" "}
          {newEmail || "your new email address"}
        </Text>
        <Text style={styles.subtitle}>
         Please check your email inbox
          and click the verification link. Once you've clicked the link, return
          here and click Verify below.
        </Text>
        {/* Verification Image */}
        <Image
          source={require("../../assets/verification.png")}
          style={styles.verificationImage}
          resizeMode="contain"
        />
        {/* Verify Button */}
        <CustomButton
          text={verifying ? "Verifying..." : "Verify Email & Update"}
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

export default UpdateEmailVerificationScreen;

