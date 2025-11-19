import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../config/colors';
import fonts from '../../config/fonts';
import HeaderSvg from '../../assets/home/Header.svg';
import SearchSvg from '../../assets/home/Search 1.svg';
import MessageSvg from '../../assets/home/Message 22.svg';

const { height: screenHeight } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  // Sample data for feed posts
  const feedData = [
    {
      id: '1',
      username: 'rookie_xt',
      profileImage: { uri: 'https://i.pravatar.cc/150?img=1' },
      isVerified: true,
      timeAgo: '5h',
      videoThumbnail: { uri: 'https://images.pexels.com/photos/1542085/pexels-photo-1542085.jpeg?auto=compress&cs=tinysrgb&w=800' },
      videoDuration: '05',
      views: '741,368',
      caption: 'Parabéns Ayrton, minha inspiração sempre 🇧🇷💫',
      description: 'A tribute to the legendary Ayrton Senna',
      hasTranslation: true,
    },
    {
      id: '2',
      username: 'sarah_williams',
      profileImage: { uri: 'https://i.pravatar.cc/150?img=32' },
      isVerified: false,
      timeAgo: '3h',
      videoThumbnail: { uri: 'https://images.pexels.com/photos/290591/pexels-photo-290591.jpeg?auto=compress&cs=tinysrgb&w=800' },
      videoDuration: '12',
      views: '234,567',
      caption: 'Morning workout session complete! 💪',
      description: 'Starting the day with energy and determination',
      hasTranslation: false,
    },
    {
      id: '3',
      username: 'mike_johnson',
      profileImage: { uri: 'https://i.pravatar.cc/150?img=15' },
      isVerified: true,
      timeAgo: '7h',
      videoThumbnail: { uri: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800' },
      videoDuration: '08',
      views: '892,145',
      caption: 'New music drop coming soon! 🎵',
      description: 'Working on something special for you all',
      hasTranslation: true,
    },
    {
      id: '4',
      username: 'emma_davis',
      profileImage: { uri: 'https://i.pravatar.cc/150?img=47' },
      isVerified: false,
      timeAgo: '1h',
      videoThumbnail: { uri: 'https://images.pexels.com/photos/255379/pexels-photo-255379.jpeg?auto=compress&cs=tinysrgb&w=800' },
      videoDuration: '15',
      views: '156,789',
      caption: 'Sunset vibes 🌅',
      description: 'Beautiful evening at the beach',
      hasTranslation: false,
    },
    {
      id: '5',
      username: 'alex_brown',
      profileImage: { uri: 'https://i.pravatar.cc/150?img=5' },
      isVerified: true,
      timeAgo: '12h',
      videoThumbnail: { uri: 'https://images.pexels.com/photos/2531728/pexels-photo-2531728.jpeg?auto=compress&cs=tinysrgb&w=800' },
      videoDuration: '20',
      views: '1,234,567',
      caption: 'Behind the scenes of our latest project',
      description: "Exclusive look at what we've been working on",
      hasTranslation: true,
    },
    {
      id: '6',
      username: 'chris_lee',
      profileImage: { uri: 'https://i.pravatar.cc/150?img=54' },
      isVerified: false,
      timeAgo: '2h',
      videoThumbnail: { uri: 'https://images.pexels.com/photos/414612/pexels-photo-414612.jpeg?auto=compress&cs=tinysrgb&w=800' },
      videoDuration: '10',
      views: '345,678',
      caption: 'Training hard for the competition! 🏆',
      description: 'Every day is a step closer to victory',
      hasTranslation: false,
    },
    {
      id: '7',
      username: 'lisa_anderson',
      profileImage: { uri: 'https://i.pravatar.cc/150?img=29' },
      isVerified: true,
      timeAgo: '6h',
      videoThumbnail: { uri: 'https://images.pexels.com/photos/358457/pexels-photo-358457.jpeg?auto=compress&cs=tinysrgb&w=800' },
      videoDuration: '18',
      views: '567,890',
      caption: 'New dance routine is fire! 🔥',
      description: 'Practicing the moves that will blow your mind',
      hasTranslation: true,
    },
    {
      id: '8',
      username: 'david_martinez',
      profileImage: { uri: 'https://i.pravatar.cc/150?img=23' },
      isVerified: false,
      timeAgo: '4h',
      videoThumbnail: { uri: 'https://images.pexels.com/photos/1343507/pexels-photo-1343507.jpeg?auto=compress&cs=tinysrgb&w=800' },
      videoDuration: '07',
      views: '123,456',
      caption: 'Cooking up something delicious 👨‍🍳',
      description: 'Trying out a new recipe today',
      hasTranslation: false,
    },
    {
      id: '9',
      username: 'jessica_taylor',
      profileImage: { uri: 'https://i.pravatar.cc/150?img=11' },
      isVerified: true,
      timeAgo: '9h',
      videoThumbnail: { uri: 'https://images.pexels.com/photos/34045/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800' },
      videoDuration: '14',
      views: '789,012',
      caption: 'Travel adventures continue ✈️',
      description: 'Exploring new places and creating memories',
      hasTranslation: true,
    },
    {
      id: '10',
      username: 'ryan_clark',
      profileImage: { uri: 'https://i.pravatar.cc/150?img=41' },
      isVerified: false,
      timeAgo: '8h',
      videoThumbnail: { uri: 'https://images.pexels.com/photos/4068315/pexels-photo-4068315.jpeg?auto=compress&cs=tinysrgb&w=800' },
      videoDuration: '11',
      views: '456,789',
      caption: 'Tech review: Latest gadgets unboxed 📱',
      description: 'Breaking down the newest tech releases',
      hasTranslation: false,
    },
  ];

  const renderPost = ({ item }) => (
    <View style={styles.postContainer}>
      {/* User Header */}
      <View style={styles.postHeader}>
        <TouchableOpacity
          style={styles.userInfo}
          onPress={() =>
            navigation.navigate('UserProfile', {
              user: {
                username: item.username,
                name: item.username,
                profession: 'Content Creator',
                avatar: item.profileImage,
                followers: 512,
                following: 500,
                winBattle: '49/50',
              },
            })
          }
        >
          <Image source={item.profileImage} style={styles.profileImage} />
          <View style={styles.userDetails}>
            <View style={styles.usernameRow}>
              <Text style={styles.username}>{item.username}</Text>
              <Text style={styles.timeAgo}>{item.timeAgo}</Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.challengeButton}
          onPress={() => navigation.navigate('Challenge', { post: item })}
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

      {/* Description */}
      {item.description && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <HeaderSvg width={150} height={40} />
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <SearchSvg width={24} height={24} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => navigation.navigate('Inbox')}
          >
            <MessageSvg width={24} height={24} />
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
  },
  logo: {
    width: 150,
    height: 40,
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  iconButton: {
    padding: 4,
  },
  feedList: {
    flex: 1,
  },
  feedContent: {
    // paddingBottom: 20,
  },
  postContainer: {
    marginBottom: 30,
    // maxHeight: screenHeight * 0.6,
    // height: screenHeight * 0.6,
    // overflow: "hidden",
    // borderWidth: 1,
    // borderColor: colors.border,

  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
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
    flexDirection: "row",
    alignItems: "center",
  },
  username: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginRight: 4,
  },
  timeAgo: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  challengeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#582FFF",
    borderRadius: 6,
    minWidth: 90,
  },
  challengeButtonText: {
    color: colors.textLight,
    fontSize: 14,
    fontFamily: fonts.semiBold,
  },
  videoContainer: {
    width: "100%",
    aspectRatio: 9 / 16,
    backgroundColor: colors.border,
    position: "relative",
  },
  videoThumbnail: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  videoOverlay: {
    position: "absolute",
    top: 12,
    left: 12,
  },
  playButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
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
  descriptionContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    zIndex: 1000,
    backgroundColor: colors.background,
  },
  description: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    fontFamily: fonts.regular,
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

