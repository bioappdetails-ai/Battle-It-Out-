import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../config/colors';
import fonts from '../../config/fonts';

const ProfileScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('Battles');

  // Sample video data with online thumbnails
  const videos = [
    { id: '1', thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg' },
    { id: '2', thumbnail: 'https://i.ytimg.com/vi/jNQXAC9IVRw/maxresdefault.jpg' },
    { id: '3', thumbnail: 'https://i.ytimg.com/vi/9bZkp7q19f0/maxresdefault.jpg' },
    { id: '4', thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/maxresdefault.jpg' },
    { id: '5', thumbnail: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/maxresdefault.jpg' },
    { id: '6', thumbnail: 'https://i.ytimg.com/vi/OPf0YbXqDm0/maxresdefault.jpg' },
    { id: '7', thumbnail: 'https://i.ytimg.com/vi/M7FIvfx5J10/maxresdefault.jpg' },
    { id: '8', thumbnail: 'https://i.ytimg.com/vi/L_jWHffIx5E/maxresdefault.jpg' },
    { id: '9', thumbnail: 'https://i.ytimg.com/vi/9xwazD5SyVg/maxresdefault.jpg' },
  ];

  const renderVideo = ({ item }) => (
    <TouchableOpacity style={styles.videoItem}>
      <Image 
        source={{ uri: item.thumbnail }} 
        style={styles.videoThumbnail}
        resizeMode="cover"
      />
      <View style={styles.playOverlay}>
        <Ionicons name="play" size={20} color={colors.textLight} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>jane01-a</Text>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => {
            // Debug: Check if navigation object exists
            console.log('Settings button pressed');
            console.log('Navigation object:', navigation);
            console.log('Navigation state:', navigation.getState());
            
            // Debug: Try different navigation methods
            try {
              console.log('Attempting navigation.navigate("Settings")');
              navigation.navigate('Settings');
              console.log('Navigation.navigate() called successfully');
            } catch (error) {
              console.error('Error with navigation.navigate():', error);
              
              // Fallback: Try parent navigator
              try {
                console.log('Trying parent navigator...');
                const parent = navigation.getParent();
                console.log('Parent navigator:', parent);
                if (parent) {
                  parent.navigate('Settings');
                  console.log('Parent.navigate() called successfully');
                } else {
                  console.error('No parent navigator found');
                }
              } catch (parentError) {
                console.error('Error with parent navigator:', parentError);
              }
            }
          }}
        >
          <Ionicons name="settings" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card */}
        <View style={styles.profileImageContainerBg}>
          <View style={styles.profileImageContainer}>
            <Image
              source={require("../../assets/profile.jpg")}
              style={styles.profileImage}
            />
          </View>
        </View>
        <View style={styles.profileCard}>
          <View style={styles.nameContainer}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>Jane Cooper</Text>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => navigation.navigate('UpdateProfile')}
              >
                <Ionicons
                  name="pencil-outline"
                  size={16}
                  color={colors.textLight}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.profession}>UI/UX Designer</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>512</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>500</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>49/50</Text>
              <Text style={styles.statLabel}>Win Battle</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setActiveTab("Battles")}
          >
            <View
              style={[
                styles.actionIconContainer,
                activeTab === "Battles"
                  ? styles.actionIconContainerActive
                  : styles.actionIconContainerInactive,
              ]}
            >
              <Ionicons
                name="trophy"
                size={20}
                color={colors.textLight}
              />
            </View>
            <Text
              style={[
                styles.actionButtonText,
                activeTab === "Battles" && styles.actionButtonTextActive,
              ]}
            >
              Battles
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setActiveTab("Archive")}
          >
            <View
              style={[
                styles.actionIconContainer,
                activeTab === "Archive"
                  ? styles.actionIconContainerActive
                  : styles.actionIconContainerInactive,
              ]}
            >
              <Ionicons
                name="archive-outline"
                size={20}
                color={colors.textLight}
              />
            </View>
            <Text
              style={[
                styles.actionButtonText,
                activeTab === "Archive" && styles.actionButtonTextActive,
              ]}
            >
              Archive
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setActiveTab("Saved")}
          >
            <View
              style={[
                styles.actionIconContainer,
                activeTab === "Saved"
                  ? styles.actionIconContainerActive
                  : styles.actionIconContainerInactive,
              ]}
            >
              <Ionicons
                name="bookmark-outline"
                size={20}
                color={colors.textLight}
              />
            </View>
            <Text
              style={[
                styles.actionButtonText,
                activeTab === "Saved" && styles.actionButtonTextActive,
              ]}
            >
              Saved
            </Text>
          </TouchableOpacity>
        </View>

        {/* Video Grid */}
        <FlatList
          data={videos}
          renderItem={renderVideo}
          keyExtractor={(item) => item.id}
          numColumns={3}
          scrollEnabled={false}
          contentContainerStyle={styles.videoGrid}
        />
      </ScrollView>
    </View>
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
  settingsButton: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  profileCard: {
    backgroundColor: colors.profileCard,
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  profileImage: {
    width: 120,
    height: 120,
    resizeMode: "contain",
    borderRadius: 50,
    // marginBottom: 16,
    backgroundColor: colors.background,
    borderWidth: 4,
    borderColor: colors.secondary,
    borderRadius: 500,
  },
  profileImageContainer: {
    zIndex: 1000,
    alignItems: "center",
    // marginBottom: 16,
    backgroundColor: colors.background,
    borderWidth: 5,
    borderRadius: 500,
    borderColor: colors.background,
  },
  profileImageContainerBg: {
    alignItems: "center",
    backgroundColor: colors.background,
    borderWidth: 4,
    borderColor: colors.background,
  },
  nameContainer: {
    alignItems: "center",
    marginBottom: 20,
    width: "100%",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    width: "100%",
    position: "relative",
  },
  name: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text,
    textAlign: "center",
  },
  editButton: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    right: 0,
  },
  profession: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingTop: 20,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 5,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  actionIconContainerActive: {
    backgroundColor: colors.secondary,
  },
  actionIconContainerInactive: {
    backgroundColor: "#000000",
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: "#000000",
    marginLeft: 8,
  },
  actionButtonTextActive: {
    color: colors.secondary,
    fontFamily: fonts.semiBold,
  },
  videoGrid: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  videoItem: {
    flex: 1,
    aspectRatio: 2 / 3,
    // margin: 2,
    overflow: "hidden",
    backgroundColor: colors.border,
  },
  videoThumbnail: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  playOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default ProfileScreen;


