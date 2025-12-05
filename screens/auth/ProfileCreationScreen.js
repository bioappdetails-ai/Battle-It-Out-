import React, { useState } from 'react';
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
import { createDocument } from '../../services/firestoreService';
import { uploadProfilePicture } from '../../services/cloudinaryService';
import { generateUserId } from '../../utils/uuid';
import { COLLECTIONS } from '../../services/firestoreService';

const ProfileCreationScreen = ({ navigation, route }) => {
  const [profileImage, setProfileImage] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [userName, setUserName] = useState('');
  const [profession, setProfession] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Get userId from route params or current user
  const userId = route?.params?.userId || getCurrentUser()?.uid;
  
  // Log for debugging
  React.useEffect(() => {
    console.log('📝 ProfileCreationScreen - userId:', userId);
    console.log('📝 ProfileCreationScreen - route params:', route?.params);
    console.log('📝 ProfileCreationScreen - current user:', getCurrentUser()?.uid);
  }, [userId, route?.params]);

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

  const handleComplete = async () => {
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

    if (!userId) {
      Alert.alert('Error', 'User ID not found. Please sign up again.');
      navigation.replace('Signup');
      return;
    }

    setLoading(true);
    try {
      let profileImageUrl = null;
      
      // Upload profile image if provided
      if (profileImage) {
        try {
          console.log('📤 Uploading profile image to Cloudinary...');
          console.log('📤 Image URI:', profileImage);
          console.log('📤 User ID:', userId);
          
          const uploadResult = await uploadProfilePicture(profileImage, userId);
          profileImageUrl = uploadResult.url;
          
          console.log('✅ Profile image uploaded successfully!');
          console.log('✅ Cloudinary URL:', profileImageUrl);
          console.log('✅ Public ID:', uploadResult.publicId);
        } catch (uploadError) {
          console.error('❌ Profile image upload error:', uploadError);
          console.error('❌ Error details:', JSON.stringify(uploadError, null, 2));
          Alert.alert('Warning', 'Profile image upload failed, but continuing with profile creation.');
        }
      } else {
        console.log('ℹ️ No profile image provided, skipping upload');
      }

      // Update Firebase Auth profile
      await updateUserProfile(displayName.trim(), profileImageUrl);

      // Create user document in Firestore with UUID
      const userData = {
        id: userId,
        email: getCurrentUser()?.email || '',
        displayName: displayName.trim(),
        userName: userName.trim().toLowerCase(),
        profession: profession.trim(),
        profileImage: profileImageUrl, // Cloudinary URL stored here
        battlesWon: 0,
        battlesLost: 0,
        totalBattles: 0,
        followers: 0,
        following: 0,
      };

      console.log('📝 Saving user data to Firestore...');
      console.log('📝 User data:', JSON.stringify(userData, null, 2));
      console.log('📝 Profile Image URL:', profileImageUrl);
      
      const documentId = await createDocument(COLLECTIONS.USERS, userData, userId);
      console.log('✅ User profile created in Firestore with ID:', documentId);
      console.log('✅ Profile image URL stored in Firestore:', profileImageUrl);

      // Navigate to main app
      navigation.replace('Main');
    } catch (error) {
      console.error('❌ Profile Creation Error:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      
      let errorMessage = 'Failed to create profile. Please try again.';
      if (error.code) {
        errorMessage = `Firestore error (${error.code}): ${error.message || 'Unknown error'}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
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
          title="Upload Your Bio" 
          navigation={navigation}
          onBackPress={handleBack}
        />

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
          text={loading ? 'Creating Profile...' : 'Complete'}
          onPress={handleComplete}
          style={styles.completeButton}
          disabled={loading}
        />
      </ScrollView>

      {/* Loading Modal */}
      <LoadingModal visible={loading} />
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

