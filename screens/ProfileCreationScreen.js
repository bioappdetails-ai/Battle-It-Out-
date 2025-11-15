import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import colors from '../config/colors';
import fonts from '../config/fonts';
import CustomTextInput from '../components/CustomTextInput';
import CustomButton from '../components/CustomButton';

const ProfileCreationScreen = ({ navigation }) => {
  const [profileImage, setProfileImage] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [userName, setUserName] = useState('');
  const [profession, setProfession] = useState('');

  const requestImagePermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to upload your profile picture!');
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestImagePermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleComplete = () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Please enter your display name');
      return;
    }
    if (!userName.trim()) {
      Alert.alert('Error', 'Please enter your user name');
      return;
    }
    if (!profession.trim()) {
      Alert.alert('Error', 'Please enter your profession');
      return;
    }

    // Handle profile creation logic here
    console.log('Profile Created:', {
      profileImage,
      displayName,
      userName,
      profession,
    });
    navigation.replace('Main');
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
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Upload Your Bio</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Complete your bio and challenge your friend to a battle.
        </Text>

        {/* Profile Picture Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={60} color={colors.textSecondary} />
              </View>
            )}
          </View>
          <TouchableOpacity onPress={pickImage} style={styles.uploadButton}>
            <Text style={styles.uploadText}>Upload</Text>
          </TouchableOpacity>
        </View>

        {/* Input Fields */}
        <View style={styles.inputContainer}>
          <CustomTextInput
            label="Display Name"
            placeholder="Enter Your Name"
            value={displayName}
            onChangeText={setDisplayName}
          />

          <CustomTextInput
            label="User Name"
            placeholder="Enter User Name"
            value={userName}
            onChangeText={setUserName}
            autoCapitalize="none"
          />

          <CustomTextInput
            label="Profession"
            placeholder="Dancer, Singer etc..."
            value={profession}
            onChangeText={setProfession}
          />
        </View>

        {/* Complete Button */}
        <CustomButton
          text="Complete"
          onPress={handleComplete}
          style={styles.completeButton}
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
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontFamily: fonts.medium,
    color: colors.text,
    textAlign: 'center',
    marginRight: 40,
  },
  headerSpacer: {
    width: 40,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'left',
    marginBottom: 40,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.border,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButton: {
    paddingVertical: 8,
  },
  uploadText: {
    fontSize: 16,
    color: colors.accent,
    fontWeight: '500',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 30,
  },
  completeButton: {
    backgroundColor: colors.primary,
  },
});

export default ProfileCreationScreen;

