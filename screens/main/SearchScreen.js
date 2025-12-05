import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import colors from '../../config/colors';
import fonts from '../../config/fonts';
import CustomHeader from '../../components/CustomHeader';
import { getDocuments, COLLECTIONS } from '../../services/firestoreService';
import { getCurrentUser } from '../../services/authService';

// Format views count
const formatViews = (count) => {
  if (!count) return '0';
  if (count < 1000) return count.toString();
  if (count < 1000000) return `${(count / 1000).toFixed(1)}K`.replace('.0', '');
  return `${(count / 1000000).toFixed(1)}M`.replace('.0', '');
};

const SearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [videos, setVideos] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        performSearch(searchQuery.trim());
      } else {
        setVideos([]);
        setUsers([]);
        setSearchPerformed(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = async (query) => {
    if (!query || query.length === 0) {
      setVideos([]);
      setUsers([]);
      setSearchPerformed(false);
      return;
    }

    try {
      setLoading(true);
      setSearchPerformed(true);
      const searchLower = query.toLowerCase();

      // Search videos by title, description, or category
      const allVideos = await getDocuments(
        COLLECTIONS.VIDEOS,
        [{ field: 'status', operator: '==', value: 'active' }],
        'createdAt',
        'desc',
        50 // Limit to 50 videos
      );

      // Filter videos by title, description, or category (case-insensitive)
      const filteredVideos = allVideos.filter((video) => {
        const title = (video.title || '').toLowerCase();
        const description = (video.description || '').toLowerCase();
        const category = (video.category || '').toLowerCase();
        return title.includes(searchLower) || description.includes(searchLower) || category.includes(searchLower);
      });

      setVideos(filteredVideos);

      // Search users by displayName, userName, or name
      const allUsers = await getDocuments(
        COLLECTIONS.USERS,
        [],
        'createdAt',
        'desc',
        50 // Limit to 50 users
      );

      // Filter users by name or username (case-insensitive)
      const filteredUsers = allUsers.filter((user) => {
        const displayName = (user.displayName || '').toLowerCase();
        const userName = (user.userName || '').toLowerCase();
        const name = (user.name || '').toLowerCase();
        return (
          displayName.includes(searchLower) ||
          userName.includes(searchLower) ||
          name.includes(searchLower)
        );
      });

      setUsers(filteredUsers);

      // Search battles by category
      try {
        const { getBattleFeedByCategory } = await import('../services/battleService');
        const categories = ['Music', 'Singing', 'Writing', 'Art', 'Sports', 'Gym', 'Food', 'Traveling', 'Racing', 'Swimming'];
        const matchingCategory = categories.find(cat => cat.toLowerCase() === searchLower);
        
        if (matchingCategory) {
          // If search query matches a category, fetch battles in that category
          const categoryBattles = await getBattleFeedByCategory(matchingCategory, 20);
          setBattles(categoryBattles);
        } else {
          // Search battles by category name (partial match)
          const allBattles = await getDocuments(
            COLLECTIONS.BATTLES,
            [{ field: 'status', operator: '==', value: 'active' }],
            'createdAt',
            'desc',
            50
          );
          const filteredBattles = allBattles.filter((battle) => {
            const category = (battle.category || '').toLowerCase();
            const title = (battle.title || '').toLowerCase();
            return category.includes(searchLower) || title.includes(searchLower);
          });
          setBattles(filteredBattles);
        }
      } catch (error) {
        console.error('Error searching battles:', error);
        setBattles([]);
      }
    } catch (error) {
      console.error('Error performing search:', error);
      setVideos([]);
      setUsers([]);
      setBattles([]);
    } finally {
      setLoading(false);
    }
  };

  // Reset search when screen loses focus
  useFocusEffect(
    useCallback(() => {
      return () => {
        // Optional: Clear search when leaving screen
        // setSearchQuery('');
        // setVideos([]);
        // setUsers([]);
        // setSearchPerformed(false);
      };
    }, [])
  );

  const renderVideoItem = ({ item }) => {
    const getThumbnailSource = () => {
      if (item.thumbnailUrl) {
        return { uri: item.thumbnailUrl };
      }
      return require('../../assets/profile.jpg');
    };

    return (
      <TouchableOpacity
        style={styles.videoItem}
        onPress={() => {
          // Navigate to video details or battle view
          // For now, we can navigate to UserProfile or show video
          if (item.userId) {
            navigation.navigate('UserProfile', {
              user: {
                id: item.userId,
                userName: item.userName || 'User',
                name: item.userName || 'User',
              },
            });
          }
        }}
      >
        <Image source={getThumbnailSource()} style={styles.videoThumbnail} />
        <View style={styles.videoInfo}>
          <Text style={styles.videoTitle} numberOfLines={2}>
            {item.title || 'Untitled Video'}
          </Text>
          <Text style={styles.videoMeta} numberOfLines={1}>
            {item.userName || 'Unknown User'} • {formatViews(item.views || 0)} views
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    );
  };

  const renderUserItem = ({ item }) => {
    const getAvatarSource = () => {
      if (item.profileImage) {
        return { uri: item.profileImage };
      }
      return require('../../assets/profile.jpg');
    };

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => {
          navigation.navigate('UserProfile', {
            user: {
              id: item.id,
              username: item.userName || item.displayName || 'User',
              name: item.displayName || item.userName || 'User',
              profession: item.profession || 'Content Creator',
              avatar: item.profileImage || null,
              followers: item.followers || 0,
              following: item.following || 0,
              winBattle: item.totalBattles > 0
                ? `${item.battlesWon || 0}/${item.totalBattles}`
                : '0/0',
              ...item,
            },
          });
        }}
      >
        <Image source={getAvatarSource()} style={styles.userAvatar} />
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {item.displayName || item.userName || item.name || 'User'}
          </Text>
          <Text style={styles.userUsername} numberOfLines={1}>
            @{item.userName || item.displayName || 'user'}
          </Text>
          {item.profession && (
            <Text style={styles.userProfession} numberOfLines={1}>
              {item.profession}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    );
  };

  const getFilteredResults = () => {
    if (activeTab === 'All') {
      return { videos, users, battles };
    } else if (activeTab === 'Videos') {
      return { videos, users: [], battles: [] };
    } else if (activeTab === 'Persons') {
      return { videos: [], users, battles: [] };
    } else if (activeTab === 'Battles') {
      return { videos: [], users: [], battles };
    }
    return { videos: [], users: [], battles: [] };
  };

  const { videos: filteredVideos, users: filteredUsers, battles: filteredBattles } = getFilteredResults();

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.emptyText}>Searching...</Text>
        </View>
      );
    }

    if (!searchPerformed) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>Search for videos or users</Text>
          <Text style={styles.emptySubtext}>
            Enter a video title or user name to get started
          </Text>
        </View>
      );
    }

    if (searchQuery.trim().length > 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No results found</Text>
          <Text style={styles.emptySubtext}>
            Try searching with different keywords
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <CustomHeader title="Search" navigation={navigation} />

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search videos or users..."
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus={true}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setVideos([]);
                setUsers([]);
                setBattles([]);
                setSearchPerformed(false);
              }}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'All' && styles.tabActive]}
          onPress={() => setActiveTab('All')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'All' && styles.tabTextActive,
            ]}
          >
            All
          </Text>
          {activeTab === 'All' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'Videos' && styles.tabActive]}
          onPress={() => setActiveTab('Videos')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'Videos' && styles.tabTextActive,
            ]}
          >
            Videos
          </Text>
          {activeTab === 'Videos' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'Persons' && styles.tabActive]}
          onPress={() => setActiveTab('Persons')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'Persons' && styles.tabTextActive,
            ]}
          >
            Persons
          </Text>
          {activeTab === 'Persons' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'Battles' && styles.tabActive]}
          onPress={() => setActiveTab('Battles')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'Battles' && styles.tabTextActive,
            ]}
          >
            Battles
          </Text>
          {activeTab === 'Battles' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      {/* Results */}
      {loading && !searchPerformed ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.resultsContainer}
          contentContainerStyle={styles.resultsContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Videos Section */}
          {(activeTab === 'All' || activeTab === 'Videos') && filteredVideos.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Videos ({filteredVideos.length})
              </Text>
              <FlatList
                data={filteredVideos}
                renderItem={renderVideoItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            </View>
          )}

          {/* Users Section */}
          {(activeTab === 'All' || activeTab === 'Persons') && filteredUsers.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Users ({filteredUsers.length})
              </Text>
              <FlatList
                data={filteredUsers}
                renderItem={renderUserItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            </View>
          )}

          {/* Battles Section */}
          {(activeTab === 'All' || activeTab === 'Battles') && filteredBattles && filteredBattles.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Battles ({filteredBattles.length})
              </Text>
              <FlatList
                data={filteredBattles}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.videoItem}
                    onPress={() => {
                      navigation.navigate('BattleView', { battle: item });
                    }}
                  >
                    <View style={styles.battleThumbnailContainer}>
                      <Image 
                        source={{ uri: item.player1ThumbnailUrl || 'https://via.placeholder.com/150' }} 
                        style={[styles.battleThumbnail, { marginRight: 4 }]} 
                      />
                      <Image 
                        source={{ uri: item.player2ThumbnailUrl || 'https://via.placeholder.com/150' }} 
                        style={styles.battleThumbnail} 
                      />
                    </View>
                    <View style={styles.videoInfo}>
                      <Text style={styles.videoTitle} numberOfLines={2}>
                        {item.category || item.title || 'Battle'}
                      </Text>
                      <Text style={styles.videoMeta} numberOfLines={1}>
                        {item.totalVotes || 0} votes
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            </View>
          )}

          {/* Empty State */}
          {filteredVideos.length === 0 && filteredUsers.length === 0 && (!filteredBattles || filteredBattles.length === 0) && renderEmptyState()}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.itemBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
    padding: 0,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  tabActive: {
    // Active state styling handled by text color
  },
  tabText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },
  tabTextActive: {
    fontFamily: fonts.semiBold,
    color: colors.secondary,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.secondary,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsContent: {
    paddingBottom: 20,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 12,
  },
  videoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  videoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: colors.border,
    marginRight: 12,
  },
  videoInfo: {
    flex: 1,
  },
  videoTitle: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 4,
  },
  videoMeta: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.border,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 2,
  },
  userUsername: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  userProfession: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 92, // Align with content (avatar/thumbnail width + margin)
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default SearchScreen;

