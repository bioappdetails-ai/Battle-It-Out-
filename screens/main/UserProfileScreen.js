import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../config/colors';
import fonts from '../../config/fonts';
import CustomHeader from '../../components/CustomHeader';
import WinRateSvg from '../../assets/win_rate.svg';
import ClashSvg from '../../assets/clash.svg';
import DislikeSvg from '../../assets/Dislike.svg';
import MessageSvg from '../../assets/messageBg.svg';

const UserProfileScreen = ({ route, navigation }) => {
  const { user } = route.params || {};
  const [activeTab, setActiveTab] = useState('Win Battles');
  const [isFollowing, setIsFollowing] = useState(false);

  // Default user data
  const userData = user || {
    id: '1',
    username: 'rookie_xt',
    name: 'Jane Cooper',
    profession: 'Video Editor',
    avatar: require('../../assets/profile.jpg'),
    followers: 512,
    following: 500,
    winBattle: '49/50',
  };

  // Helper to get image source
  const getImageSource = (source) => {
    if (typeof source === 'string') {
      return { uri: source };
    }
    return source;
  };

  // Sample video data
  const videos = [
    { id: '1', thumbnail: 'https://i.pravatar.cc/150?img=1' },
    { id: '2', thumbnail: 'https://i.pravatar.cc/150?img=2' },
    { id: '3', thumbnail: 'https://i.pravatar.cc/150?img=3' },
    { id: '4', thumbnail: 'https://i.pravatar.cc/150?img=4' },
    { id: '5', thumbnail: 'https://i.pravatar.cc/150?img=5' },
    { id: '6', thumbnail: 'https://i.pravatar.cc/150?img=6' },
    { id: '7', thumbnail: 'https://i.pravatar.cc/150?img=7' },
    { id: '8', thumbnail: 'https://i.pravatar.cc/150?img=8' },
    { id: '9', thumbnail: 'https://i.pravatar.cc/150?img=9' },
  ];

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    // Handle follow logic
  };

  const handleBattleRequest = () => {
    // Navigate to battle upload or send battle request
    navigation.navigate('Add');
  };

  const handleMessage = () => {
    // Navigate to message details
    navigation.navigate('MessageDetails', {
      message: {
        id: userData.id,
        senderName: userData.name,
        avatar: userData.avatar,
        isOnline: true,
      },
    });
  };

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
      <CustomHeader title={userData.username} navigation={navigation} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card */}
        <View style={styles.profileImageContainerBg}>
          <View style={styles.profileImageContainer}>
            <Image
              source={getImageSource(userData.avatar)}
              style={styles.profileImage}
            />
          </View>
        </View>
        <View style={styles.profileCard}>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{userData.name}</Text>
            <Text style={styles.profession}>{userData.profession}</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userData.followers}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userData.following}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userData.winBattle}</Text>
              <Text style={styles.statLabel}>Win Battle</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                isFollowing && styles.actionButtonFollowing,
              ]}
              onPress={handleFollow}
            >
              <Text
                style={[
                  styles.actionButtonText,
                  isFollowing && styles.actionButtonTextFollowing,
                ]}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleBattleRequest}
            >
              <Text style={styles.actionButtonText}>Battle Request</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.messageButton} onPress={handleMessage}>
              <MessageSvg width={20} height={20} style={{tintColor: colors.textLight}}/>
            </TouchableOpacity>
          </View>
        </View>

        {/* Category Tabs */}
        <View style={styles.categoryTabs}>
          <TouchableOpacity
            style={styles.categoryTab}
            onPress={() => setActiveTab('Win Battles')}
          >
            <View
              style={[
                styles.categoryIconContainer,
                activeTab === 'Win Battles'
                  ? styles.categoryIconContainerActive
                  : styles.categoryIconContainerInactive,
              ]}
            >
              <WinRateSvg width={20} height={20} />
            </View>
            <Text
              style={[
                styles.categoryTabText,
                activeTab === 'Win Battles' && styles.categoryTabTextActive,
              ]}
            >
              Win Battles
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.categoryTab}
            onPress={() => setActiveTab('Clash')}
          >
            <View
              style={[
                styles.categoryIconContainer,
                activeTab === 'Clash'
                  ? styles.categoryIconContainerActive
                  : styles.categoryIconContainerInactive,
              ]}
            >
              <ClashSvg width={20} height={20} />
            </View>
            <Text
              style={[
                styles.categoryTabText,
                activeTab === 'Clash' && styles.categoryTabTextActive,
              ]}
            >
              Clash
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.categoryTab}
            onPress={() => setActiveTab('Loosed')}
          >
            <View
              style={[
                styles.categoryIconContainer,
                activeTab === 'Loosed'
                  ? styles.categoryIconContainerActive
                  : styles.categoryIconContainerInactive,
              ]}
            >
              <DislikeSvg width={20} height={20} />
            </View>
            <Text
              style={[
                styles.categoryTabText,
                activeTab === 'Loosed' && styles.categoryTabTextActive,
              ]}
            >
              Loosed
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
    resizeMode: "cover",
    borderRadius: 60,
    backgroundColor: colors.background,
    borderWidth: 4,
    borderColor: colors.secondary,
  },
  profileImageContainer: {
    zIndex: 1000,
    alignItems: "center",
    backgroundColor: colors.background,
    borderWidth: 5,
    borderRadius: 60,
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
  name: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text,
    textAlign: "center",
    marginBottom: 4,
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
    paddingBottom: 20,
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
  actionButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    // paddingHorizontal: 16,
    borderRadius: 8,
    height: 44,

    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  actionButtonFollowing: {
    backgroundColor: colors.itemBackground,
  },
  actionButtonText: {
    fontSize: 13,
    fontFamily: fonts.semiBold,
    color: colors.textLight,
  },
  actionButtonTextFollowing: {
    color: colors.text,
  },
  messageButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryTabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 5,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryIconContainerActive: {
    backgroundColor: colors.secondary,
  },
  categoryIconContainerInactive: {
    backgroundColor: "#000000",
  },
  categoryTabText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: "#000000",
    marginLeft: 8,
  },
  categoryTabTextActive: {
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
    overflow: "hidden",
    backgroundColor: colors.border,
    margin: 1,
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

export default UserProfileScreen;

