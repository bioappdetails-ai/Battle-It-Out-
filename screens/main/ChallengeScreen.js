import React, { useState } from 'react';
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
import UploadSvg from '../../assets/upload.svg';

const ChallengeScreen = ({ route, navigation }) => {
  const { post } = route.params || {};
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Music');

  const categories = [
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
  ];

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
      setSelectedVideo(result.assets[0]);
    }
  };

  const handleUpload = () => {
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

    // Handle upload logic here
    console.log('Uploading challenge:', {
      video: selectedVideo,
      title,
      description,
      category: selectedCategory,
    });

    Alert.alert('Success', 'Challenge uploaded successfully!', [
      { text: 'OK', onPress: () => navigation.navigate('Main') },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <CustomHeader title="Challenge" navigation={navigation} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Video Upload Section - Two Sections */}
        <View style={styles.videoSection}>
          {/* Left: Challenged Post Thumbnail */}
          <View style={styles.challengedPostContainer}>
            {post?.videoThumbnail ? (
              <Image
                source={post.videoThumbnail}
                style={styles.challengedThumbnail}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.challengedPlaceholder}>
                <Ionicons name="image-outline" size={40} color={colors.textSecondary} />
              </View>
            )}
          </View>

          {/* Right: Upload Area */}
          <View style={styles.uploadSection}>
            {selectedVideo ? (
              <View style={styles.videoPreview}>
                <Image
                  source={{ uri: selectedVideo.uri }}
                  style={styles.videoThumbnail}
                  resizeMode="cover"
                />
                <View style={styles.videoOverlay}>
                  <Ionicons name="play-circle" size={32} color={colors.textLight} />
                </View>
                <TouchableOpacity
                  style={styles.removeVideoButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    setSelectedVideo(null);
                  }}
                >
                  <Ionicons name="close-circle" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.uploadPlaceholderContainer}
                onPress={pickVideo}
                activeOpacity={0.8}
              >
                <View style={styles.uploadPlaceholder}>
                  <UploadSvg width={48} height={48} />
                  <Text style={styles.uploadText}>Upload Your Video</Text>
                  <Text style={styles.uploadFormats}>MP4, MOV, AVI</Text>
                </View>
              </TouchableOpacity>
            )}

            {!selectedVideo && (
              <TouchableOpacity
                style={styles.selectVideoButton}
                onPress={pickVideo}
              >
                <Text style={styles.selectVideoButtonText}>Select Video</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Input Fields */}
        <View style={styles.inputSection}>
          <CustomTextInput
            label="Title"
            placeholder="Enter Title"
            value={title}
            onChangeText={setTitle}
          />

          <CustomTextInput
            label="Description"
            placeholder="Enter Description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
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
            <TouchableOpacity style={styles.addCategoryButton}>
              <Text style={styles.addCategoryText}>+ Add New</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Upload Button */}
        <CustomButton
          text="Upload"
          onPress={handleUpload}
          style={styles.uploadButton}
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  videoSection: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  challengedPostContainer: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.itemBackground,
    marginRight: 12,
  },
  challengedThumbnail: {
    width: '100%',
    height: '100%',
  },
  challengedPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.itemBackground,
  },
  uploadSection: {
    flex: 1,
    aspectRatio: 1,
  },
  uploadPlaceholderContainer: {
    width: '100%',
    height: '100%',
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
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
    height: '100%',
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
    marginTop: 16,
  },
  selectVideoButtonText: {
    fontSize: 14,
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
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 12,
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
    borderWidth: 1,
    borderColor: colors.primary,
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
  uploadButton: {
    backgroundColor: colors.primary,
    marginTop: 8,
  },
});

export default ChallengeScreen;

