import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../config/colors';
import fonts from '../../config/fonts';
import PasswordInput from '../../components/PasswordInput';
import CustomButton from '../../components/CustomButton';
import CustomHeader from '../../components/CustomHeader';

const UpdatePasswordScreen = ({ navigation }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleUpdate = () => {
    if (!currentPassword.trim()) {
      Alert.alert('Error', 'Please enter your current password');
      return;
    }
    if (!newPassword.trim()) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }
    // if (newPassword.length < 6) {
    //   Alert.alert('Error', 'Password must be at least 6 characters');
    //   return;
    // }
    // if (newPassword !== confirmPassword) {
    //   Alert.alert('Error', 'New passwords do not match');
    //   return;
    // }

    // Navigate to verification screen
    navigation.navigate('UpdatePasswordVerification');
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
              Update your password to keep your account secure.
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

            <PasswordInput
              label="Enter Your New Password"
              placeholder="Enter Your New Password"
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <PasswordInput
              label="Confirm Your New Password"
              placeholder="Confirm Your New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          {/* Update Button */}
          <CustomButton
            text="Update Password"
            onPress={handleUpdate}
            style={styles.updateButton}
          />
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
});

export default UpdatePasswordScreen;

