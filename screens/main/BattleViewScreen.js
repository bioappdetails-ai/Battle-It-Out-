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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../config/colors';
import fonts from '../../config/fonts';
import VSSvg from '../../assets/VS.svg';
import VoteSvg from '../../assets/vote.svg';
import CustomHeader from '../../components/CustomHeader';

const { width, height } = Dimensions.get('window');

const BattleViewScreen = ({ route, navigation }) => {
  const { battle } = route.params || {};
  
  // Default battle data if not provided
  const battleData = battle || {
    id: 1,
    category: 'Singing',
    timeRemaining: 25 * 60, // 25 minutes in seconds
    player1: {
      id: 1,
      name: 'Eva James',
      avatar: 'https://i.pravatar.cc/150?img=1',
      videoUri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      votes: 560,
    },
    player2: {
      id: 2,
      name: 'Sarah Williams',
      avatar: 'https://i.pravatar.cc/150?img=3',
      videoUri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      votes: 220,
    },
    recentVotes: [
      {
        id: 1,
        user: {
          name: 'Eva James',
          avatar: 'https://i.pravatar.cc/150?img=1',
        },
        player: 1,
        time: '1:00 PM',
      },
      {
        id: 2,
        user: {
          name: 'Mike Johnson',
          avatar: 'https://i.pravatar.cc/150?img=2',
        },
        player: 2,
        time: '1:01 PM',
      },
    ],
  };

  // Ensure battleData has all required properties
  const safeBattleData = {
    ...battleData,
    player1: battleData.player1 || {
      id: 1,
      name: 'Player 1',
      avatar: 'https://i.pravatar.cc/150?img=1',
      votes: 0,
    },
    player2: battleData.player2 || {
      id: 2,
      name: 'Player 2',
      avatar: 'https://i.pravatar.cc/150?img=2',
      votes: 0,
    },
    recentVotes: battleData.recentVotes || [],
  };

  const [timeRemaining, setTimeRemaining] = useState(safeBattleData.timeRemaining || 25 * 60);
  const [player1Votes, setPlayer1Votes] = useState(safeBattleData.player1.votes || 560);
  const [player2Votes, setPlayer2Votes] = useState(safeBattleData.player2.votes || 220);
  const [recentVotes, setRecentVotes] = useState(safeBattleData.recentVotes || []);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedPlayer, setVotedPlayer] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `-${mins}:${secs.toString().padStart(2, '0')} Mint`;
  };

  const handleVote = (playerNumber) => {
    if (hasVoted) return;

    setHasVoted(true);
    setVotedPlayer(playerNumber);

    if (playerNumber === 1) {
      setPlayer1Votes((prev) => prev + 1);
    } else {
      setPlayer2Votes((prev) => prev + 1);
    }

    // Add to recent votes
    const newVote = {
      id: Date.now(),
      user: {
        name: 'You',
        avatar: 'https://i.pravatar.cc/150?img=10',
      },
      player: playerNumber,
      time: new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }),
    };
    setRecentVotes((prev) => [newVote, ...prev]);
  };

  const totalVotes = player1Votes + player2Votes;
  const player1Percentage = totalVotes > 0 ? (player1Votes / totalVotes) * 100 : 0;
  const player2Percentage = totalVotes > 0 ? (player2Votes / totalVotes) * 100 : 0;

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
              source={{ uri: safeBattleData.player1.avatar }}
              style={styles.playerImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.vsContainer}>
            <View style={styles.vsCircle}>
              <VSSvg width={60} height={106} />
            </View>
          </View>
          <View style={styles.playerImageContainer}>
            <Image
              source={{ uri: safeBattleData.player2.avatar }}
              style={styles.playerImage}
              resizeMode="cover"
            />
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
              hasVoted && votedPlayer !== 1 && styles.voteButtonDisabled,
            ]}
            onPress={() => handleVote(1)}
            disabled={hasVoted && votedPlayer !== 1}
          >
            <VoteSvg width={20} height={20} />
            <Text style={styles.voteButtonText}>Vote</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.voteButton,
              styles.player2VoteButton,
              hasVoted && votedPlayer !== 2 && styles.voteButtonDisabled,
            ]}
            onPress={() => handleVote(2)}
            disabled={hasVoted && votedPlayer !== 2}
          >
            <VoteSvg width={20} height={20} />
            <Text style={styles.voteButtonText}>Vote</Text>
          </TouchableOpacity>
        </View>

        {/* Voting People */}
        <View style={styles.votingPeopleContainer}>
          <Text style={styles.votingPeopleTitle}>Voting People</Text>
          {recentVotes && recentVotes.length > 0 ? (
            recentVotes.map((vote) => (
              <View key={vote.id} style={styles.voteItem}>
                <Image
                  source={{ uri: vote.user.avatar }}
                  style={styles.voteItemAvatar}
                />
                <View style={styles.voteItemText}>
                  <Text style={styles.voteItemName}>
                    {vote.user.name} give vote to Player{vote.player}
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
});

export default BattleViewScreen;

