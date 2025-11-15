import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../config/colors';
import fonts from '../config/fonts';

const HomeScreen = ({ navigation }) => {
  // Sample data for feed posts
  const feedData = [
    {
      id: '1',
      username: 'lewishamilton',
      profileImage: require('../assets/icon.png'),
      isVerified: true,
      timeAgo: '5h',
      videoThumbnail: require('../assets/icon.png'),
      videoDuration: '05',
      views: '741,368',
      caption: 'Parabéns Ayrton, minha inspiração sempre 🇧🇷💫',
      hasTranslation: true,
    },
    {
      id: '2',
      username: 'lewishamilton',
      profileImage: require('../assets/icon.png'),
      isVerified: true,
      timeAgo: '5h',
      videoThumbnail: require('../assets/icon.png'),
      videoDuration: '05',
      views: '741,368',
      caption: 'Parabéns Ayrton, minha inspiração sempre 🇧🇷💫',
      hasTranslation: true,
    },
  ];

  const renderPost = ({ item }) => (
    <View style={styles.postContainer}>
      {/* User Header */}
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <Image source={item.profileImage} style={styles.profileImage} />
          <View style={styles.userDetails}>
            <View style={styles.usernameRow}>
              <Text style={styles.username}>{item.username}</Text>
              {item.isVerified && (
                <Ionicons name="checkmark-circle" size={16} color={colors.accent} style={styles.verifiedIcon} />
              )}
              <Text style={styles.timeAgo}>{item.timeAgo}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={styles.challengeButton}
          onPress={() => console.log('Challenge', item.username)}
        >
          <Text style={styles.challengeButtonText}>Challenge</Text>
        </TouchableOpacity>
      </View>

      {/* Video Content */}
      <View style={styles.videoContainer}>
        <Image source={item.videoThumbnail} style={styles.videoThumbnail} />
        <View style={styles.videoOverlay}>
          <View style={styles.playButton}>
            <Ionicons name="play" size={16} color={colors.textLight} />
            <Text style={styles.videoDuration}>{item.videoDuration}</Text>
          </View>
        </View>
      </View>

      {/* Views */}
      <Text style={styles.views}>{item.views} View</Text>

      {/* Caption */}
      <View style={styles.captionContainer}>
        <Text style={styles.caption}>
          <Text style={styles.captionUsername}>{item.username}</Text> {item.caption}
        </Text>
        {item.hasTranslation && (
          <TouchableOpacity>
            <Text style={styles.translationLink}>See translation</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="search" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => navigation.navigate('Messages')}
          >
            <Ionicons name="chatbubble-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Feed */}
      <FlatList
        data={feedData}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feedContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: {
    width: 150,
    height: 40,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  iconButton: {
    padding: 4,
  },
  feedContent: {
    paddingBottom: 20,
  },
  postContainer: {
    marginBottom: 30,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginRight: 4,
  },
  verifiedIcon: {
    marginRight: 4,
  },
  timeAgo: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  challengeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.primary,
    borderRadius: 6,
    minWidth: 90,
  },
  challengeButtonText: {
    color: colors.textLight,
    fontSize: 14,
    fontFamily: fonts.semiBold,
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 9 / 16,
    backgroundColor: colors.border,
    position: 'relative',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  videoOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  videoDuration: {
    color: colors.textLight,
    fontSize: 12,
    fontFamily: fonts.medium,
    marginLeft: 4,
  },
  views: {
    fontSize: 14,
    color: colors.textSecondary,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  captionContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  caption: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  captionUsername: {
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  translationLink: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
});

export default HomeScreen;

