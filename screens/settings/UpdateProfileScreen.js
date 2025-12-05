import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import colors from '../../config/colors';
import fonts from '../../config/fonts';
import CustomTextInput from '../../components/CustomTextInput';
import CustomButton from '../../components/CustomButton';
import CustomHeader from '../../components/CustomHeader';
import LoadingModal from '../../components/LoadingModal';
import { getCurrentUser, updateUserProfile } from '../../services/authService';
import { getDocument, updateDocument } from '../../services/firestoreService';
import { uploadProfilePicture } from '../../services/cloudinaryService';
import { COLLECTIONS } from '../../services/firestoreService';

const UpdateProfileScreen = ({ navigation }) => {
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageUri, setProfileImageUri] = useState(null); // Local URI for new image
  const [displayName, setDisplayName] = useState('');
  const [userName, setUserName] = useState('');
  const [profession, setProfession] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [userData, setUserData] = useState(null);

  // Load user data on mount
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const currentUser = getCurrentUser();
      
      if (!currentUser) {
        Alert.alert('Error', 'No user found. Please login again.');
        navigation.goBack();
        return;
      }

      console.log('📝 Loading user data for:', currentUser.uid);
      const profile = await getDocument(COLLECTIONS.USERS, currentUser.uid);
      
      if (profile) {
        console.log('✅ User profile loaded:', profile);
        setUserData(profile);
        setDisplayName(profile.displayName || '');
        setUserName(profile.userName || '');
        setProfession(profile.profession || '');
        setProfileImage(profile.profileImage || null);
      } else {
        Alert.alert('Error', 'Profile not found. Please complete your profile first.');
        navigation.goBack();
      }
    } catch (error) {
      console.error('❌ Error loading user data:', error);
      Alert.alert('Error', 'Failed to load profile data. Please try again.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

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
      setProfileImageUri(result.assets[0].uri); // New image to upload
      setProfileImage(result.assets[0].uri); // Show preview
    }
  };

  const handleUpdate = async () => {
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

    setUpdating(true);
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        Alert.alert('Error', 'No user found. Please login again.');
        return;
      }

      let profileImageUrl = userData?.profileImage || null;

      // Upload new profile image if selected
      if (profileImageUri) {
        try {
          console.log('📤 Uploading new profile image to Cloudinary...');
          console.log('📤 Image URI:', profileImageUri);
          console.log('📤 User ID:', currentUser.uid);
          
          const uploadResult = await uploadProfilePicture(profileImageUri, currentUser.uid);
          profileImageUrl = uploadResult.url;
          
          console.log('✅ Profile image uploaded successfully!');
          console.log('✅ Cloudinary URL:', profileImageUrl);
          console.log('✅ Public ID:', uploadResult.publicId);
        } catch (uploadError) {
          console.error('❌ Profile image upload error:', uploadError);
          console.error('❌ Error details:', JSON.stringify(uploadError, null, 2));
          Alert.alert('Warning', 'Profile image upload failed, but continuing with profile update.');
        }
      } else {
        console.log('ℹ️ No new profile image selected, keeping existing image');
        console.log('ℹ️ Current profile image URL:', profileImageUrl);
      }

      // Update Firebase Auth profile
      await updateUserProfile(displayName.trim(), profileImageUrl);

      // Update Firestore document
      const updateData = {
        displayName: displayName.trim(),
        userName: userName.trim().toLowerCase(),
        profession: profession.trim(),
        profileImage: profileImageUrl, // Cloudinary URL stored here
      };

      console.log('📝 Updating user data in Firestore...');
      console.log('📝 Update data:', JSON.stringify(updateData, null, 2));
      console.log('📝 Profile Image URL:', profileImageUrl);
      
      await updateDocument(COLLECTIONS.USERS, currentUser.uid, updateData);
      console.log('✅ Profile updated successfully in Firestore');
      console.log('✅ Profile image URL stored in Firestore:', profileImageUrl);

      Alert.alert('Success', 'Your profile has been updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('❌ Profile update error:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  // Get profile image source
  const getProfileImageSource = () => {
    if (profileImage) {
      return { uri: profileImage };
    }
    return require('../../assets/profile.jpg');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header with Back Button */}
      <CustomHeader 
        title="Edit Profile" 
        navigation={navigation}
        onBackPress={handleBack}
      />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Update your profile information and keep it up to date.
        </Text>

        {/* Profile Picture Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Image
              source={getProfileImageSource()}
              style={styles.profileImage}
            />
          </View>
          <TouchableOpacity onPress={pickImage} style={styles.uploadButton} disabled={updating}>
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
            editable={!updating}
          />

          <CustomTextInput
            label="User Name"
            placeholder="Enter User Name"
            value={userName}
            onChangeText={setUserName}
            autoCapitalize="none"
            editable={!updating}
          />

          <CustomTextInput
            label="Profession"
            placeholder="Dancer, Singer etc..."
            value={profession}
            onChangeText={setProfession}
            editable={!updating}
          />
        </View>

        {/* Update Button */}
        <CustomButton
          text={updating ? 'Updating...' : 'Update Profile'}
          onPress={handleUpdate}
          style={styles.updateButton}
          disabled={updating}
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
    paddingBottom: 40,
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
  updateButton: {
    backgroundColor: colors.primary,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
});

export default UpdateProfileScreen;

