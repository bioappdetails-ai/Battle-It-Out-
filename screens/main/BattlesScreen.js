import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  StatusBar,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../config/colors';
import fonts from '../../config/fonts';
import WinRateSvg from '../../assets/win_rate.svg';
import CustomHeader from '../../components/CustomHeader';
import LoadingModal from '../../components/LoadingModal';
import { getCurrentUser } from '../../services/authService';
import {
  getDocuments,
  getDocument,
  COLLECTIONS,
  timestampToDate,
} from '../../services/firestoreService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BattlesScreen = ({ navigation }) => {
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeBattleIndex, setActiveBattleIndex] = useState(0);
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 60 });
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      const index = viewableItems[0].index || 0;
      setActiveBattleIndex(index);
    }
  });

  // Calculate win probability
  const calculateWinProbability = (yourVotes, totalVotes) => {
    if (totalVotes === 0) return '0%';
    const probability = (yourVotes / totalVotes) * 100;
    return `${Math.round(probability)}%`;
  };

  // Get battle status (Ongoing or Ended)
  const getBattleStatus = (battle) => {
    if (battle.status === 'completed' || battle.status === 'expired') {
      return 'Ended';
    }
    
    // Calculate if battle has ended (24 hours from creation)
    if (battle.createdAt) {
      const createdDate = timestampToDate(battle.createdAt);
      if (createdDate) {
        const now = Date.now();
        const battleEndTime = createdDate.getTime() + (24 * 60 * 60 * 1000); // 24 hours in milliseconds
        if (now >= battleEndTime) {
          return 'Ended';
        }
      }
    }
    
    // Check expiresAt as fallback
    if (battle.expiresAt) {
      const expireDate = timestampToDate(battle.expiresAt);
      if (expireDate && expireDate.getTime() <= Date.now()) {
        return 'Ended';
      }
    }
    
    return 'Ongoing';
  };

  // Format remaining time (24 hours from creation)
  const formatRemainingTime = (battle) => {
    const status = getBattleStatus(battle);
    if (status === 'Ended') {
      return 'Ended';
    }

    // Calculate remaining time from 24 hours from creation
    if (battle.createdAt) {
      const createdDate = timestampToDate(battle.createdAt);
      if (createdDate) {
        const now = Date.now();
        const battleEndTime = createdDate.getTime() + (24 * 60 * 60 * 1000); // 24 hours
        const remaining = battleEndTime - now;
        
        if (remaining <= 0) {
          return 'Ended';
        }

        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

        if (hours > 0) {
          return `${hours}h ${minutes}m ${seconds}s`;
        } else if (minutes > 0) {
          return `${minutes}m ${seconds}s`;
        } else {
          return `${seconds}s`;
        }
      }
    }

    // Fallback to expiresAt if createdAt not available
    if (battle.expiresAt) {
      const expireDate = timestampToDate(battle.expiresAt);
      if (expireDate) {
        const now = Date.now();
        const remaining = expireDate.getTime() - now;
        if (remaining <= 0) {
          return 'Ended';
        }
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
        if (hours > 0) {
          return `${hours}h ${minutes}m ${seconds}s`;
        } else if (minutes > 0) {
          return `${minutes}m ${seconds}s`;
        } else {
          return `${seconds}s`;
        }
      }
    }

    return 'Calculating...';
  };

  // Format timestamp for voters
  const formatVoterTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = timestampToDate(timestamp);
      if (!date) return '';
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (error) {
      return '';
    }
  };

  // Fetch battles for current user
  const fetchBattles = async () => {
    try {
      setLoading(true);
      const currentUser = getCurrentUser();
      if (!currentUser) {
        setBattles([]);
        setLoading(false);
        return;
      }

      // Fetch battles where current user is player1 or player2
      const player1Battles = await getDocuments(
        COLLECTIONS.BATTLES,
        [{ field: 'player1UserId', operator: '==', value: currentUser.uid }],
        'createdAt',
        'desc'
      );

      const player2Battles = await getDocuments(
        COLLECTIONS.BATTLES,
        [{ field: 'player2UserId', operator: '==', value: currentUser.uid }],
        'createdAt',
        'desc'
      );

      // Combine and deduplicate
      const allBattles = [...player1Battles, ...player2Battles];
      const uniqueBattles = allBattles.filter(
        (battle, index, self) => index === self.findIndex((b) => b.id === battle.id)
      );

      // Filter out pending battles - only show active, completed, or expired battles
      const activeBattles = uniqueBattles.filter(
        (battle) => battle.status !== 'pending'
      );

      // Transform battles to match existing structure
      const transformedBattles = await Promise.all(
        activeBattles.map(async (battle) => {
          const isPlayer1 = battle.player1UserId === currentUser.uid;
          const yourVotes = isPlayer1 ? (battle.player1Votes || 0) : (battle.player2Votes || 0);
          const opponentVotes = isPlayer1 ? (battle.player2Votes || 0) : (battle.player1Votes || 0);
          const totalVotes = yourVotes + opponentVotes;

          // Fetch opponent user profile
          const opponentUserId = isPlayer1 ? battle.player2UserId : battle.player1UserId;
          let opponentUser = null;
          let yourUser = null;

          try {
            if (opponentUserId) {
              opponentUser = await getDocument(COLLECTIONS.USERS, opponentUserId);
            }
            yourUser = await getDocument(COLLECTIONS.USERS, currentUser.uid);
          } catch (error) {
            console.error('Error fetching user profiles:', error);
          }

          // Fetch video thumbnails
          let yourThumbnail = null;
          let opponentThumbnail = null;

          try {
            if (isPlayer1 && battle.player1VideoId) {
              const yourVideo = await getDocument(COLLECTIONS.VIDEOS, battle.player1VideoId);
              yourThumbnail = yourVideo?.thumbnailUrl;
            } else if (!isPlayer1 && battle.player2VideoId) {
              const yourVideo = await getDocument(COLLECTIONS.VIDEOS, battle.player2VideoId);
              yourThumbnail = yourVideo?.thumbnailUrl;
            }

            if (isPlayer1 && battle.player2VideoId) {
              const opponentVideo = await getDocument(COLLECTIONS.VIDEOS, battle.player2VideoId);
              opponentThumbnail = opponentVideo?.thumbnailUrl;
            } else if (!isPlayer1 && battle.player1VideoId) {
              const opponentVideo = await getDocument(COLLECTIONS.VIDEOS, battle.player1VideoId);
              opponentThumbnail = opponentVideo?.thumbnailUrl;
            }
          } catch (error) {
            console.error('Error fetching video thumbnails:', error);
          }

          const winProbability = calculateWinProbability(yourVotes, totalVotes);
          const status = getBattleStatus(battle);
          const remainingTime = formatRemainingTime(battle);
          const voteLead = yourVotes > opponentVotes 
            ? `Lead from: ${yourVotes - opponentVotes} vote${yourVotes - opponentVotes !== 1 ? 's' : ''}`
            : opponentVotes > yourVotes
            ? `Behind by: ${opponentVotes - yourVotes} vote${opponentVotes - yourVotes !== 1 ? 's' : ''}`
            : 'Tied';

          // Fetch recent votes for voters list
          let voters = [];
          try {
            const votes = await getDocuments(
              COLLECTIONS.VOTES,
              [{ field: 'battleId', operator: '==', value: battle.id }]
            );

            // Sort by createdAt descending and limit to 10
            const sortedVotes = votes
              .sort((a, b) => {
                const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
                const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
                return bTime - aTime;
              })
              .slice(0, 10);

            voters = await Promise.all(
              sortedVotes.map(async (vote) => {
                let voterUser = null;
                try {
                  voterUser = await getDocument(COLLECTIONS.USERS, vote.voterId);
                } catch (error) {
                  console.error('Error fetching voter user:', error);
                }

                const playerUsername = vote.playerNumber === 1 
                  ? (battle.player1UserName || 'Player 1')
                  : (battle.player2UserName || 'Player 2');

                return {
                  id: vote.id,
                  name: voterUser?.displayName || voterUser?.userName || vote.voterName || 'Unknown User',
                  message: vote.playerNumber === (isPlayer1 ? 1 : 2)
                    ? `Voted for you`
                    : `Voted for ${playerUsername}`,
                  time: formatVoterTime(vote.createdAt),
                  avatar: voterUser?.profileImage || vote.voterAvatar || 'https://i.pravatar.cc/150?img=10',
                };
              })
            );
          } catch (error) {
            console.error('Error fetching votes:', error);
          }

          return {
            id: battle.id,
            title: battle.title || battle.category || 'Battle',
            description: battle.description || '',
            status: status,
            remainingTime: remainingTime,
            totalVote: totalVotes,
            opponentVotes: opponentVotes,
            winRate: winProbability, // Using winRate field name but it's actually win probability
            voteLead: voteLead,
            yourVotes: yourVotes,
            opponentAvatar: opponentThumbnail || opponentUser?.profileImage || 'https://i.pravatar.cc/150?img=12',
            yourAvatar: yourThumbnail || yourUser?.profileImage || 'https://i.pravatar.cc/150?img=15',
            voters: voters,
          };
        })
      );

      if (transformedBattles.length > 0) {
        setBattles(transformedBattles);
      } else {
        setBattles([]);
      }
    } catch (error) {
      console.error('Error fetching battles:', error);
      setBattles([]);
    } finally {
      setLoading(false);
    }
  };

  // Use focus effect to refresh when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchBattles();
    }, [])
  );

  const activeBattle = battles[activeBattleIndex] || battles[0];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <CustomHeader 
        title="Analytics" 
        navigation={navigation}
      />
      <ScrollView contentContainerStyle={styles.content}>
          {/* Battle Carousel */}
          <View style={styles.carouselWrapper}>
            <FlatList
              data={battles}
              keyExtractor={(item) => item.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              snapToAlignment="start"
              decelerationRate="fast"
              viewabilityConfig={viewabilityConfig.current}
              onViewableItemsChanged={onViewableItemsChanged.current}
              renderItem={({ item }) => (
                <View style={[styles.battleCard, { width: SCREEN_WIDTH - 60 }]}>
                  <View style={styles.battleImages}>
                    <Image
                      source={{ uri: item.opponentAvatar }}
                      style={styles.battleImage}
                    />
                    <Image
                      source={{ uri: item.yourAvatar }}
                      style={styles.battleImage}
                    />
                  </View>
                  <View style={styles.battleInfo}>
                    <Text style={styles.battleTitle}>{item.title}</Text>
                    <Text style={styles.battleMeta}>Status: {item.status || 'Ongoing'}</Text>
                    <Text style={styles.battleMeta}>Remaining: {item.remainingTime || 'Calculating...'}</Text>
                    <Text style={styles.battleMeta}>Total vote : {item.totalVote}</Text>
                  </View>
                </View>
              )}
              ItemSeparatorComponent={() => <View style={{ width: 20 }} />}
            />
          </View>

          {/* Stats */}
          {activeBattle && (
            <>
              <View style={styles.statsRow}>
                <View style={[styles.statCard, styles.opponentCard]}>
                  <Text style={[styles.statLabel, styles.statLabelBold]}>Opponent votes</Text>
                  <Text style={styles.statValue}>{activeBattle.opponentVotes || 0}</Text>
                </View>
                <View style={[styles.statCard, styles.winRateCard]}>
                  <View style={styles.winRateHeader}>
                    <Text style={[styles.statLabel, styles.statLabelBold]}>Win Probability</Text>
                    <WinRateSvg width={28} height={28} />
                  </View>
                  <Text style={styles.statValue}>{activeBattle.winRate || '0%'}</Text>
                </View>
              </View>

              <View style={styles.voteCard}>
                <View>
                  <Text style={styles.voteLabel}>Vote</Text>
                  <Text style={styles.voteLead}>{activeBattle.voteLead || 'No votes yet'}</Text>
                </View>
                <Text style={styles.voteValue}>{activeBattle.yourVotes || 0}</Text>
              </View>

              {/* Voters */}
              <Text style={styles.sectionTitle}>Voting People</Text>
              <View style={styles.votersList}>
                {activeBattle.voters && activeBattle.voters.length > 0 ? (
                  activeBattle.voters.map((voter) => (
                    <View key={voter.id} style={styles.voterItem}>
                      <Image source={{ uri: voter.avatar }} style={styles.voterAvatar} />
                      <View style={styles.voterInfo}>
                        <Text style={styles.voterName}>{voter.name}</Text>
                        <Text style={styles.voterMessage}>{voter.message}</Text>
                      </View>
                      <Text style={styles.voterTime}>{voter.time}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyVotersText}>No votes yet</Text>
                )}
              </View>
            </>
          )}
        </ScrollView>

      {/* Loading Modal */}
      <LoadingModal visible={loading} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 40,
  },
  carouselWrapper: {
    marginBottom: 20,
  },
  battleCard: {
    backgroundColor: colors.itemBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  battleImages: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  battleImage: {
    flex: 1,
    height: 120,
    borderRadius: 12,
  },
  battleInfo: {
    gap: 4,
  },
  battleTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  battleDescription: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  battleMeta: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
  },
  opponentCard: {
    backgroundColor: '#D9E8FF',
  },
  winRateCard: {
    backgroundColor: '#FCD9E5',
  },
  winRateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.text,
    marginBottom: 8,
  },
  statLabelBold: {
    fontFamily: fonts.bold,
  },
  statValue: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: colors.secondary,
  },
  voteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#809BFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  voteLabel: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.textLight,
  },
  voteLead: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.textLight,
    marginTop: 4,
  },
  voteValue: {
    fontSize: 36,
    fontFamily: fonts.bold,
    color: colors.textLight,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 12,
  },
  votersList: {
    backgroundColor: colors.itemBackground,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 12,
  },
  voterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  voterAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  voterInfo: {
    flex: 1,
  },
  voterName: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  voterMessage: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  voterTime: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyVotersText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
});

export default BattlesScreen;

