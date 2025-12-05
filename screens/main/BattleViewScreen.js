import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  StatusBar,
  ScrollView,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../config/colors';
import fonts from '../../config/fonts';
import VSSvg from '../../assets/VS.svg';
import VoteSvg from '../../assets/vote.svg';
import CustomHeader from '../../components/CustomHeader';
import LoadingModal from '../../components/LoadingModal';
import { getCurrentUser } from '../../services/authService';
import {
  getDocuments,
  getDocument,
  createDocument,
  updateDocument,
  subscribeToCollection,
  subscribeToDocument,
  incrementField,
  COLLECTIONS,
  timestampToDate,
} from '../../services/firestoreService';
import { trackViewWithDuration } from '../../services/viewService';
import { generateUUID } from '../../utils/uuid';
import { serverTimestamp, increment } from 'firebase/firestore';
import { isBattleExpired, completeBattle } from '../../services/battleService';
import { isBattleExpired, completeBattle } from '../../services/battleService';

const { width, height } = Dimensions.get('window');

const BattleViewScreen = ({ route, navigation }) => {
  const { battle } = route.params || {};
  
  useEffect(() => {
    if (!battle) {
      Alert.alert('Error', 'No battle data found. Please try again.');
      navigation.goBack();
    }
  }, [battle, navigation]);

  if (!battle) {
    return null;
  }

  // Ensure battleData has all required properties
  const safeBattleData = {
    ...battle,
    player1: battle.player1 || {
      id: null,
      name: 'Player 1',
      avatar: null,
      votes: 0,
    },
    player2: battle.player2 || {
      id: null,
      name: 'Player 2',
      avatar: null,
      votes: 0,
    },
    recentVotes: battle.recentVotes || [],
  };

  // Calculate initial time remaining from battle createdAt (24 hours from creation)
  const calculateTimeRemaining = (battle) => {
    if (!battle || !battle.createdAt) {
      return 0;
    }
    
    try {
      const createdDate = timestampToDate(battle.createdAt);
      if (!createdDate) return 0;
      
      const now = Date.now();
      const battleEndTime = createdDate.getTime() + (24 * 60 * 60 * 1000); // 24 hours in milliseconds
      const remaining = Math.max(0, Math.floor((battleEndTime - now) / 1000)); // Convert to seconds
      
      return remaining;
    } catch (error) {
      console.error('Error calculating time remaining:', error);
      return 0;
    }
  };

  const [battleDoc, setBattleDoc] = useState(battle || null);
  const [timeRemaining, setTimeRemaining] = useState(() => calculateTimeRemaining(safeBattleData));
  const [player1Votes, setPlayer1Votes] = useState(safeBattleData.player1.votes || 0);
  const [player2Votes, setPlayer2Votes] = useState(safeBattleData.player2.votes || 0);
  const [recentVotes, setRecentVotes] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedPlayer, setVotedPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [player1Views, setPlayer1Views] = useState(safeBattleData.player1?.stats?.views || 0);
  const [player2Views, setPlayer2Views] = useState(safeBattleData.player2?.stats?.views || 0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const viewRecorded = useRef(new Set()); // Track which videos have already recorded views
  const battleId = safeBattleData.battleId || safeBattleData.id;
  const player1VideoId = safeBattleData.player1?.videoId || safeBattleData.player1VideoId;
  const player2VideoId = safeBattleData.player2?.videoId || safeBattleData.player2VideoId;

  // Fetch battle data and votes from Firestore
  useEffect(() => {
    if (!battleId) {
      setLoading(false);
      return;
    }

    const fetchBattleData = async () => {
      try {
        setLoading(true);
        
        // Fetch battle document to get current vote counts and calculate time remaining
        const fetchedBattleDoc = await getDocument(COLLECTIONS.BATTLES, battleId);
        if (fetchedBattleDoc) {
          setBattleDoc(fetchedBattleDoc);
          setPlayer1Votes(fetchedBattleDoc.player1Votes || 0);
          setPlayer2Votes(fetchedBattleDoc.player2Votes || 0);
          
          // Calculate and set actual time remaining
          const remaining = calculateTimeRemaining(fetchedBattleDoc);
          setTimeRemaining(remaining);
        }

        // Check if current user has already voted
        const currentUser = getCurrentUser();
        if (currentUser) {
          const existingVotes = await getDocuments(
            COLLECTIONS.VOTES,
            [
              { field: 'battleId', operator: '==', value: battleId },
              { field: 'voterId', operator: '==', value: currentUser.uid },
            ]
          );
          
          if (existingVotes.length > 0) {
            setHasVoted(true);
            setVotedPlayer(existingVotes[0].playerNumber);
          }
        }

        // Fetch recent votes
        await fetchRecentVotes();
      } catch (error) {
        console.error('Error fetching battle data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBattleData();

    // Subscribe to real-time vote updates
    const unsubscribeVotes = subscribeToCollection(
      COLLECTIONS.VOTES,
      async (votes) => {
        const battleVotes = votes.filter(vote => vote.battleId === battleId);
        await fetchRecentVotes();
        
        // Update vote counts from battle document
        try {
          const battleDoc = await getDocument(COLLECTIONS.BATTLES, battleId);
          if (battleDoc) {
            setPlayer1Votes(battleDoc.player1Votes || 0);
            setPlayer2Votes(battleDoc.player2Votes || 0);
          }
        } catch (error) {
          console.error('Error updating vote counts:', error);
        }
      },
      [{ field: 'battleId', operator: '==', value: battleId }],
      'createdAt',
      'desc'
    );

    // Subscribe to battle document updates
    const unsubscribeBattle = subscribeToDocument(
      COLLECTIONS.BATTLES,
      battleId,
      (updatedBattle) => {
        if (updatedBattle) {
          setBattleDoc(updatedBattle);
          setPlayer1Votes(updatedBattle.player1Votes || 0);
          setPlayer2Votes(updatedBattle.player2Votes || 0);
          setPlayer1Views(updatedBattle.player1Views || 0);
          setPlayer2Views(updatedBattle.player2Views || 0);
          
          // Update time remaining when battle document updates
          const remaining = calculateTimeRemaining(updatedBattle);
          setTimeRemaining(remaining);
        }
      }
    );
    
    // Track views when screen loads and videos are displayed
    const trackInitialViews = async () => {
      if (player1VideoId && !viewRecorded.current.has(`player1_${player1VideoId}`)) {
        // Track view after a short delay to ensure video is playing
        setTimeout(async () => {
          const recorded = await trackViewWithDuration(player1VideoId, 'battleview', 3000);
          if (recorded) {
            viewRecorded.current.add(`player1_${player1VideoId}`);
            await incrementField(COLLECTIONS.BATTLES, battleId, 'player1Views', 1).catch(() => {});
          }
        }, 3000);
      }
      
      if (player2VideoId && !viewRecorded.current.has(`player2_${player2VideoId}`)) {
        // Track view after a short delay to ensure video is playing
        setTimeout(async () => {
          const recorded = await trackViewWithDuration(player2VideoId, 'battleview', 3000);
          if (recorded) {
            viewRecorded.current.add(`player2_${player2VideoId}`);
            await incrementField(COLLECTIONS.BATTLES, battleId, 'player2Views', 1).catch(() => {});
          }
        }, 3000);
      }
    };
    
    trackInitialViews();

    return () => {
      if (unsubscribeVotes && typeof unsubscribeVotes === 'function') {
        unsubscribeVotes();
      }
      if (unsubscribeBattle && typeof unsubscribeBattle === 'function') {
        unsubscribeBattle();
      }
    };
  }, [battleId, player1VideoId, player2VideoId]);

  // Fetch recent votes with user information
  const fetchRecentVotes = async () => {
    if (!battleId) return;

    try {
      // Fetch votes without orderBy to avoid index requirement, then sort in memory
      let votes = await getDocuments(
        COLLECTIONS.VOTES,
        [{ field: 'battleId', operator: '==', value: battleId }]
      );

      // Sort by createdAt in descending order (most recent first)
      votes = votes.sort((a, b) => {
        const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return bTime - aTime; // Descending order
      });

      // Limit to 20 most recent votes
      votes = votes.slice(0, 20);

      // Get current battle data to access player names
      let currentBattle = null;
      try {
        currentBattle = await getDocument(COLLECTIONS.BATTLES, battleId);
      } catch (error) {
        console.error('Error fetching battle for player names:', error);
      }

      // Fetch user information for each vote
      const votesWithUsers = await Promise.all(
        votes.map(async (vote) => {
          let userProfile = null;
          try {
            userProfile = await getDocument(COLLECTIONS.USERS, vote.voterId);
          } catch (error) {
            console.error('Error fetching user profile:', error);
          }

          // Get player username from battle data or fallback
          let playerUsername = 'Player';
          if (vote.playerNumber === 1) {
            playerUsername = currentBattle?.player1UserName 
              || safeBattleData.player1.name 
              || 'Player 1';
          } else {
            playerUsername = currentBattle?.player2UserName 
              || safeBattleData.player2.name 
              || 'Player 2';
          }

          return {
            id: vote.id,
            user: {
              id: vote.voterId,
              name: userProfile?.userName || userProfile?.displayName || vote.voterName || 'Unknown User',
              avatar: userProfile?.profileImage || vote.voterAvatar || 'https://i.pravatar.cc/150?img=10',
            },
            playerNumber: vote.playerNumber,
            playerUsername: playerUsername,
            time: formatTimestamp(vote.createdAt),
            createdAt: vote.createdAt,
          };
        })
      );

      setRecentVotes(votesWithUsers);
    } catch (error) {
      console.error('Error fetching recent votes:', error);
      // If it's an index error, the votes will still be fetched (just not ordered)
      // The error is logged but we continue with empty array
      if (error.code === 'failed-precondition') {
        console.warn('Firestore index is still building. Votes will be available once index is ready.');
      }
      setRecentVotes([]);
    }
  };

  // Format timestamp helper
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = timestampToDate(timestamp);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      
      if (isToday) {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      }
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (error) {
      return '';
    }
  };

  useEffect(() => {
    // Countdown timer - recalculate every second to ensure accuracy
    const timer = setInterval(() => {
      if (battleDoc && battleDoc.createdAt) {
        const remaining = calculateTimeRemaining(battleDoc);
        setTimeRemaining(remaining);
      } else {
        setTimeRemaining((prev) => {
          if (prev <= 0) {
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [battleDoc]);

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `-${hours}h ${mins}m`;
    }
    return `-${mins}m`;
  };

  const handleVote = async (playerNumber) => {
    if (hasVoted || !battleId) return;

    const currentUser = getCurrentUser();
    if (!currentUser) {
      Alert.alert('Error', 'You need to be logged in to vote.');
      return;
    }

    try {
      setVoting(true);

      // Check if user has already voted
      const existingVotes = await getDocuments(
        COLLECTIONS.VOTES,
        [
          { field: 'battleId', operator: '==', value: battleId },
          { field: 'voterId', operator: '==', value: currentUser.uid },
        ]
      );

      if (existingVotes.length > 0) {
        Alert.alert('Already Voted', 'You have already voted in this battle.');
        return;
      }

      // Get user profile for the vote
      let userProfile = null;
      try {
        userProfile = await getDocument(COLLECTIONS.USERS, currentUser.uid);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }

      // Create vote document
      const voteId = generateUUID();
      const voteData = {
        battleId: battleId,
        voterId: currentUser.uid,
        voterName: userProfile?.userName || userProfile?.displayName || currentUser.displayName || 'Unknown',
        voterAvatar: userProfile?.profileImage || null,
        playerNumber: playerNumber,
        createdAt: serverTimestamp(),
      };

      await createDocument(COLLECTIONS.VOTES, voteData, voteId);

      // Update battle vote counts
      const voteField = playerNumber === 1 ? 'player1Votes' : 'player2Votes';
      await updateDocument(COLLECTIONS.BATTLES, battleId, {
        [voteField]: increment(1),
        totalVotes: increment(1),
      });

      // Create notifications for both battle participants
      try {
        const { createNotification } = await import('../../services/notificationService');
        const battleData = await getDocument(COLLECTIONS.BATTLES, battleId);
        
        if (battleData) {
          // Notify player 1
          if (battleData.player1UserId && battleData.player1UserId !== currentUser.uid) {
            await createNotification(battleData.player1UserId, 'vote', {
              senderId: currentUser.uid,
              battleId: battleId,
              playerNumber: playerNumber,
            });
          }
          
          // Notify player 2
          if (battleData.player2UserId && battleData.player2UserId !== currentUser.uid) {
            await createNotification(battleData.player2UserId, 'vote', {
              senderId: currentUser.uid,
              battleId: battleId,
              playerNumber: playerNumber,
            });
          }
        }
      } catch (error) {
        console.error('Error creating vote notifications:', error);
        // Don't fail the vote action if notification creation fails
      }

      // Update local state
      setHasVoted(true);
      setVotedPlayer(playerNumber);
      
      if (playerNumber === 1) {
        setPlayer1Votes((prev) => prev + 1);
      } else {
        setPlayer2Votes((prev) => prev + 1);
      }

      // Refresh recent votes
      await fetchRecentVotes();
    } catch (error) {
      console.error('Error submitting vote:', error);
      Alert.alert('Error', 'Failed to submit vote. Please try again.');
    } finally {
      setVoting(false);
    }
  };

  const totalVotes = player1Votes + player2Votes;
  const player1Percentage = totalVotes > 0 ? (player1Votes / totalVotes) * 100 : 0;
  const player2Percentage = totalVotes > 0 ? (player2Votes / totalVotes) * 100 : 0;

  // Loading state is handled by LoadingModal below

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <CustomHeader 
        title="Battle view" 
        navigation={navigation}
        rightComponent={
          <View style={styles.timerContainer}>
            <Ionicons name="time-outline" size={16} color={colors.text} />
            <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
          </View>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Battle Video Thumbnails */}
        <View style={styles.battleContainer}>
          <View style={styles.playerImageContainer}>
            <Image
              source={{ 
                uri: safeBattleData.player1.thumbnailUrl || safeBattleData.player1.videoUri || safeBattleData.player1.avatar 
              }}
              style={styles.playerImage}
              resizeMode="cover"
            />
            <View style={styles.playOverlay}>
              <Ionicons name="play-circle" size={48} color={colors.textLight} />
            </View>
          </View>
          <View style={styles.vsContainer}>
            <View style={styles.vsCircle}>
              <VSSvg width={60} height={106} />
            </View>
          </View>
          <View style={styles.playerImageContainer}>
            <Image
              source={{ 
                uri: safeBattleData.player2.thumbnailUrl || safeBattleData.player2.videoUri || safeBattleData.player2.avatar 
              }}
              style={styles.playerImage}
              resizeMode="cover"
            />
            <View style={styles.playOverlay}>
              <Ionicons name="play-circle" size={48} color={colors.textLight} />
            </View>
          </View>
        </View>

        {/* Vote Statistics */}
        <View style={styles.voteStatsContainer}>
          <View style={styles.voteStatsHeader}>
            <Text style={styles.voteStatsTitle}>Vote Statistic</Text>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>{safeBattleData.category || 'Battle'}</Text>
            </View>
          </View>

          {/* Player 1 Vote Bar */}
          <View style={styles.voteBarRow}>
            <View style={styles.voteBarContainer}>
              <View style={[styles.voteBar, styles.player1Bar, { width: `${player1Percentage}%` }]}>
                <Text style={styles.player1VoteCount}>{player1Votes}</Text>
              </View>
            </View>
            <Image
              source={{ uri: safeBattleData.player1.avatar }}
              style={styles.voteBarAvatar}
            />
          </View>

          {/* Player 2 Vote Bar */}
          <View style={styles.voteBarRow}>
            <View style={styles.voteBarContainer}>
              <View style={[styles.voteBar, styles.player2Bar, { width: `${player2Percentage}%` }]}>
                <Text style={styles.player2VoteCount}>{player2Votes}</Text>
              </View>
            </View>
            <Image
              source={{ uri: safeBattleData.player2.avatar }}
              style={styles.voteBarAvatar}
            />
          </View>
        </View>

        {/* Vote Buttons */}
        <View style={styles.voteButtonsContainer}>
          <TouchableOpacity
            style={[
              styles.voteButton,
              styles.player1VoteButton,
              (hasVoted && votedPlayer !== 1) || voting && styles.voteButtonDisabled,
            ]}
            onPress={() => handleVote(1)}
            disabled={(hasVoted && votedPlayer !== 1) || voting}
          >
            {voting && votedPlayer === 1 ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <VoteSvg width={20} height={20} />
                <Text style={styles.voteButtonText}>Vote</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.voteButton,
              styles.player2VoteButton,
              (hasVoted && votedPlayer !== 2) || voting && styles.voteButtonDisabled,
            ]}
            onPress={() => handleVote(2)}
            disabled={(hasVoted && votedPlayer !== 2) || voting}
          >
            {voting && votedPlayer === 2 ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <VoteSvg width={20} height={20} />
                <Text style={styles.voteButtonText}>Vote</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Voting People */}
        <View style={styles.votingPeopleContainer}>
          <Text style={styles.votingPeopleTitle}>Voting People</Text>
          {recentVotes && recentVotes.length > 0 ? (
            recentVotes.map((vote) => (
              <View key={vote.id} style={styles.voteItem}>
                <Image
                  source={{ 
                    uri: vote.user.avatar || 'https://i.pravatar.cc/150?img=10' 
                  }}
                  style={styles.voteItemAvatar}
                />
                <View style={styles.voteItemText}>
                  <Text style={styles.voteItemName}>
                    {vote.user.name} give vote to {vote.playerUsername}
                  </Text>
                </View>
                <Text style={styles.voteItemTime}>{vote.time}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noVotesText}>No votes yet</Text>
          )}
        </View>
      </ScrollView>

      {/* Loading Modal */}
      <LoadingModal visible={loading} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timerText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  battleContainer: {
    flexDirection: "row",
    height: width * 0.75,
    marginHorizontal: 10,
    marginTop: 20,
    position: "relative",
  },
  playerImageContainer: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 12,
    overflow: "hidden",
  },
  playerImage: {
    width: "100%",
    height: "100%",
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  vsContainer: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: [{ translateX: -50 }, { translateY: -73 }],
    zIndex: 10,
    alignItems: "center",
    justifyContent: "center",
    width: 100,
    height: 146,
  },
  vsCircle: {
    width: 120,
    height: 120,
    backgroundColor: "rgba(255, 255, 255)",
    borderRadius: 100,
    padding: 30,
    aspectRatio: "1/1",
    alignItems: "center",
    justifyContent: "center",
  },
  vsText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  voteStatsContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: colors.itemBackground,
    borderRadius: 12,
    padding: 16,
  },
  voteStatsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  voteStatsTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  categoryTag: {
    backgroundColor: colors.light,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.primary,
  },
  voteBarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  voteBarContainer: {
    flex: 1,
    height: 40,
    backgroundColor: colors.background,
    marginRight: 12,
    overflow: "hidden",
    borderRadius: 10,
  },
  voteBar: {
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 12,
    minWidth: 60,
  },
  player1Bar: {
    backgroundColor: "#D9E2F7",
  },
  player2Bar: {
    backgroundColor: "#F7D9E2",
  },
  player1VoteCount: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.secondary,
  },
  player2VoteCount: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
  voteBarAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.border,
  },
  voteButtonsContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 20,
    gap: 15,
  },
  voteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
  },
  player1VoteButton: {
    backgroundColor: colors.accent,
  },
  player2VoteButton: {
    backgroundColor: colors.primary,
  },
  voteButtonDisabled: {
    opacity: 0.5,
  },
  voteButtonText: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.textLight,
  },
  votingPeopleContainer: {
    marginHorizontal: 20,
    marginTop: 30,
  },
  votingPeopleTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 15,
  },
  voteItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  voteItemAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  voteItemText: {
    flex: 1,
  },
  voteItemName: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  voteItemTime: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  noVotesText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
});

export default BattleViewScreen;

