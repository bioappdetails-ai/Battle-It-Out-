import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import colors from '../../config/colors';
import fonts from '../../config/fonts';
import CustomHeader from '../../components/CustomHeader';
import CustomTextInput from '../../components/CustomTextInput';
import CustomButton from '../../components/CustomButton';
import AddCategoryModal from '../../components/AddCategoryModal';
import UploadSvg from '../../assets/upload.svg';
import {
  uploadVideo,
} from '../../services/cloudinaryService';
import { createDocument, COLLECTIONS } from '../../services/firestoreService';
import { getCurrentUser } from '../../services/authService';
import { generateUUID } from '../../utils/uuid';

const BattleUploadScreen = ({ navigation }) => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Music');
  const [savingBattle, setSavingBattle] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [uploadedVideoInfo, setUploadedVideoInfo] = useState(null);
  const progressAnimationIntervalRef = useRef(null);
  const [isAddCategoryModalVisible, setIsAddCategoryModalVisible] = useState(false);
  const [categories, setCategories] = useState([
    'Music',
    'Singing',
    'Writing',
    'Art',
    'Sports',
    'Gym',
    'Food',
    'Traveling',
    'Racing',
    'Swimming',
  ]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (progressAnimationIntervalRef.current) {
        clearInterval(progressAnimationIntervalRef.current);
        progressAnimationIntervalRef.current = null;
      }
    };
  }, []);

  const requestVideoPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Denied',
        'Sorry, we need camera roll permissions to upload your video!'
      );
      return false;
    }
    return true;
  };

  const pickVideo = async () => {
    const hasPermission = await requestVideoPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
      videoMaxDuration: 60, // 60 seconds max
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedVideo(asset);
      setUploadedVideoInfo(null);
      await uploadSelectedVideo(asset);
    }
  };

  const uploadSelectedVideo = async (videoAsset) => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      Alert.alert('Error', 'Please log in to upload videos.');
      return;
    }

    // Clear any existing animation interval
    if (progressAnimationIntervalRef.current) {
      clearInterval(progressAnimationIntervalRef.current);
      progressAnimationIntervalRef.current = null;
    }

    try {
      setVideoUploadProgress(0);
      const folder = `battleitout/videos/${currentUser.uid}`;

      const uploadResult = await uploadVideo(videoAsset.uri, folder, {
        onProgress: (progress) => {
          if (progress >= 0) {
            // Cap progress at 70% during actual upload
            const clamped = Math.min(Math.max(progress, 0), 0.7);
            setVideoUploadProgress(clamped);
          }
        },
      });

      // Upload complete, now animate from 70% to 100% over 3 seconds
      const startProgress = 0.7;
      const endProgress = 1.0;
      const duration = 3000; // 3 seconds
      const steps = 60; // Update 60 times for smooth animation
      const stepDuration = duration / steps;
      const stepIncrement = (endProgress - startProgress) / steps;
      
      let currentProgress = startProgress;
      let stepCount = 0;

      progressAnimationIntervalRef.current = setInterval(() => {
        stepCount++;
        currentProgress = startProgress + (stepIncrement * stepCount);
        
        if (currentProgress >= endProgress || stepCount >= steps) {
          setVideoUploadProgress(1.0);
          // Set uploadedVideoInfo after animation completes to show "Ready"
          setUploadedVideoInfo(uploadResult);
          if (progressAnimationIntervalRef.current) {
            clearInterval(progressAnimationIntervalRef.current);
            progressAnimationIntervalRef.current = null;
          }
        } else {
          setVideoUploadProgress(currentProgress);
        }
      }, stepDuration);
    } catch (error) {
      console.error('Video upload failed:', error);
      Alert.alert(
        'Video Upload Failed',
        error.message || 'Unable to upload video. Please try again.'
      );
      setUploadedVideoInfo(null);
      setSelectedVideo(null);
      setVideoUploadProgress(0);
      
      // Clear animation interval on error
      if (progressAnimationIntervalRef.current) {
        clearInterval(progressAnimationIntervalRef.current);
        progressAnimationIntervalRef.current = null;
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedVideo) {
      Alert.alert('Error', 'Please select a video to upload');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    if (!uploadedVideoInfo) {
      Alert.alert('Video Processing', 'Please wait for the video upload to finish.');
      return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
      Alert.alert('Error', 'You need to be logged in to upload a battle.');
      return;
    }

    try {
      setSavingBattle(true);
      const videoId = generateUUID();

      const videoData = {
        title: title.trim(),
        description: description.trim(),
        category: selectedCategory,
        videoUrl: uploadedVideoInfo.url,
        thumbnailUrl: uploadedVideoInfo.thumbnailUrl,
        publicId: uploadedVideoInfo.publicId,
        width: uploadedVideoInfo.width,
        height: uploadedVideoInfo.height,
        duration: uploadedVideoInfo.duration || selectedVideo.duration || null,
        format: uploadedVideoInfo.format,
        bytes: uploadedVideoInfo.bytes,
        userId: currentUser.uid,
        userEmail: currentUser.email || '',
        userName: currentUser.displayName || currentUser.email || 'Unknown User',
        status: 'active',
        likes: 0,
        views: 0,
        commentsCount: 0,
        source: 'mobile',
      };

      await createDocument(COLLECTIONS.VIDEOS, videoData, videoId);

      Alert.alert('Success', 'Battle uploaded successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('Main') },
      ]);

      setSelectedVideo(null);
      setTitle('');
      setDescription('');
      setSelectedCategory('Music');
      setUploadedVideoInfo(null);
      setVideoUploadProgress(0);
    } catch (error) {
      console.error('Battle upload failed:', error);
      Alert.alert(
        'Upload Failed',
        error.message || 'Unable to upload battle video. Please try again.'
      );
    } finally {
      setSavingBattle(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <CustomHeader title="Video Upload" navigation={navigation} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Video Upload Section */}
        <TouchableOpacity
          style={styles.uploadContainer}
          onPress={pickVideo}
          activeOpacity={0.8}
        >
          {selectedVideo ? (
            <View style={styles.videoPreview}>
              <Image
                source={{ uri: selectedVideo.uri }}
                style={styles.videoThumbnail}
                resizeMode="cover"
              />
              <View style={styles.videoOverlay}>
                {uploadedVideoInfo ? (
                  <>
                    <Ionicons
                      name="checkmark-circle"
                      size={48}
                      color={colors.textLight}
                    />
                    <Text style={styles.uploadStatusText}>Ready</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.uploadStatusText}>
                      {`${Math.round(
                        Math.min(Math.max(videoUploadProgress, 0), 1) * 100
                      )}%`}
                    </Text>
                    <View style={styles.inlineProgressBar}>
                      <View
                        style={[
                          styles.inlineProgressFill,
                          {
                            width: `${Math.round(
                              Math.min(Math.max(videoUploadProgress, 0), 1) * 100
                            )}%`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.uploadHint}>Uploading...</Text>
                  </>
                )}
              </View>
              <TouchableOpacity
                style={styles.removeVideoButton}
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedVideo(null);
                  setUploadedVideoInfo(null);
                  setVideoUploadProgress(0);
                }}
              >
                <Ionicons name="close-circle" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.uploadPlaceholder}>
              <UploadSvg width={64} height={64} />
              <Text style={styles.uploadText}>Upload Your Video</Text>
              <Text style={styles.uploadFormats}>MP4, MOV, AVI</Text>
              <TouchableOpacity
                style={styles.selectVideoButton}
                onPress={pickVideo}
              >
                <Text style={styles.selectVideoButtonText}>Select Video</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>

        {/* Input Fields */}
        <View style={styles.inputSection}>
          <CustomTextInput
            label="Title"
            placeholder="Enter Title"
            value={title}
            onChangeText={setTitle}
            labelStyle={styles.fieldLabel}
          />

          <CustomTextInput
            label="Description"
            placeholder="Enter Description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            labelStyle={styles.fieldLabel}
          />
        </View>

        {/* Category Selection */}
        <View style={styles.categorySection}>
          <Text style={styles.categoryLabel}>Select Category</Text>
          <View style={styles.categoryContainer}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.categoryButtonActive,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    selectedCategory === category &&
                      styles.categoryButtonTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.addCategoryButton}
              onPress={() => setIsAddCategoryModalVisible(true)}
            >
              <Text style={styles.addCategoryText}>+ Add New</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Send Challenge Button */}
        <CustomButton
          text={savingBattle ? 'Saving...' : 'Upload'}
          onPress={handleUpload}
          style={styles.sendButton}
          disabled={savingBattle}
        />
      </ScrollView>

      {/* Add Category Modal */}
      <AddCategoryModal
        visible={isAddCategoryModalVisible}
        onClose={() => setIsAddCategoryModalVisible(false)}
        onAdd={(newCategory) => {
          setCategories((prev) => [...prev, newCategory]);
          setSelectedCategory(newCategory);
        }}
        existingCategories={categories}
      />
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
  uploadContainer: {
    width: '100%',
    minHeight: 100,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dotted',
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    padding: 16,
  },
  uploadPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  uploadFormats: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  videoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeVideoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.background,
    borderRadius: 12,
  },
  selectVideoButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    margin: 12,
  },
  selectVideoButtonText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.textLight,
  },
  inputSection: {
    marginBottom: 24,
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text,
    marginBottom: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.light,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryButtonActive: {
    backgroundColor: colors.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  categoryButtonTextActive: {
    color: colors.textLight,
  },
  addCategoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.itemBackground,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    marginBottom: 8,
  },
  addCategoryText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  sendButton: {
    backgroundColor: colors.primary,
    marginTop: 8,
  },
  uploadStatusText: {
    color: colors.textLight,
    fontSize: 28,
    fontFamily: fonts.semiBold,
    textAlign: 'center',
  },
  uploadHint: {
    color: colors.textLight,
    fontSize: 12,
    marginTop: 8,
    fontFamily: fonts.regular,
  },
  inlineProgressBar: {
    width: '80%',
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
    marginTop: 8,
  },
  inlineProgressFill: {
    height: '100%',
    backgroundColor: colors.textLight,
  },
});

export default BattleUploadScreen;

