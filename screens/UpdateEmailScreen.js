import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../config/colors';
import fonts from '../config/fonts';
import CustomTextInput from '../components/CustomTextInput';
import CustomButton from '../components/CustomButton';

const UpdateEmailScreen = ({ navigation }) => {
  const [currentEmail, setCurrentEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const handleUpdate = () => {
    if (!currentEmail.trim()) {
      Alert.alert('Error', 'Please enter your current email');
      return;
    }
    if (!newEmail.trim()) {
      Alert.alert('Error', 'Please enter a new email');
      return;
    }
    // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // if (!emailRegex.test(newEmail)) {
    //   Alert.alert('Error', 'Please enter a valid email address');
    //   return;
    // }
    // if (currentEmail === newEmail) {
    //   Alert.alert('Error', 'New email must be different from current email');
    //   return;
    // }

    // Navigate to verification screen
    navigation.navigate('UpdateEmailVerification');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Update Email</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title and Subtitle */}
          <View style={styles.titleContainer}>
            <Text style={styles.subtitle}>
              Update your email and you won’t lose your data..
            </Text>
          </View>

          {/* Input Fields */}
          <View style={styles.inputContainer}>
            <CustomTextInput
              label="Enter Your Old Email"
              placeholder="Enter Your Old Email"
              value={currentEmail}
              onChangeText={setCurrentEmail}
              keyboardType="email-address"
            />

            <CustomTextInput
              label="Enter Your New Email"
              placeholder="Enter Your New Email"
              value={newEmail}
              onChangeText={setNewEmail}
              keyboardType="email-address"
            />
          </View>

          {/* Update Button */}
          <CustomButton
            text="Send Verification"
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: colors.text,
    textAlign: "left",
    flex: 1,
    marginLeft: 12,
  },
  headerSpacer: {
    width: 32,
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

export default UpdateEmailScreen;

