import React, { useRef, useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../config/colors';
import fonts from '../../config/fonts';
import WinRateSvg from '../../assets/win_rate.svg';
import CustomHeader from '../../components/CustomHeader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const battles = [
  {
    id: '1',
    title: 'Slow Reverb',
    description: 'I tried new song “Night” by Nick but in slow reverb',
    expireIn: '-25:00 min',
    totalVote: 526,
    opponentVotes: 226,
    winRate: '5%',
    voteLead: 'Lead from: 2 vote',
    yourVotes: 526,
    opponentAvatar: 'https://i.pravatar.cc/150?img=12',
    yourAvatar: 'https://i.pravatar.cc/150?img=15',
    voters: [
      {
        id: '1',
        name: 'Ariana Grande',
        message: 'Congratulations! you got one vote',
        time: '1:00 PM',
        avatar: 'https://i.pravatar.cc/150?img=32',
      },
      {
        id: '2',
        name: 'Justin Henry',
        message: 'Voted for your track',
        time: '12:45 PM',
        avatar: 'https://i.pravatar.cc/150?img=5',
      },
      {
        id: '3',
        name: 'Sofia Brooks',
        message: 'You are leading by 2 votes',
        time: '12:10 PM',
        avatar: 'https://i.pravatar.cc/150?img=24',
      },
    ],
  },
  {
    id: '2',
    title: 'Acoustic Session',
    description: 'New unplugged session recorded live in studio.',
    expireIn: '-12:30 min',
    totalVote: 342,
    opponentVotes: 198,
    winRate: '63%',
    voteLead: 'Lead from: 22 vote',
    yourVotes: 540,
    opponentAvatar: 'https://i.pravatar.cc/150?img=18',
    yourAvatar: 'https://i.pravatar.cc/150?img=10',
    voters: [
      {
        id: '4',
        name: 'Bella Swan',
        message: 'Loved your performance!',
        time: '11:45 AM',
        avatar: 'https://i.pravatar.cc/150?img=16',
      },
      {
        id: '5',
        name: 'Daniel Craig',
        message: 'I voted for you',
        time: '11:10 AM',
        avatar: 'https://i.pravatar.cc/150?img=7',
      },
    ],
  },
  {
    id: '3',
    title: 'Rap Battle',
    description: 'Freestyle challenge against MC Blaze',
    expireIn: '-05:12 min',
    totalVote: 618,
    opponentVotes: 402,
    winRate: '52%',
    voteLead: 'Lead from: 6 vote',
    yourVotes: 624,
    opponentAvatar: 'https://i.pravatar.cc/150?img=40',
    yourAvatar: 'https://i.pravatar.cc/150?img=41',
    voters: [
      {
        id: '6',
        name: 'Maya Angel',
        message: 'Bars were insane!',
        time: '09:12 AM',
        avatar: 'https://i.pravatar.cc/150?img=27',
      },
      {
        id: '7',
        name: 'Chris Nolan',
        message: 'Keep up the fire 🔥',
        time: '08:50 AM',
        avatar: 'https://i.pravatar.cc/150?img=52',
      },
    ],
  },
];

const BattlesScreen = ({ navigation }) => {
  const [activeBattleIndex, setActiveBattleIndex] = useState(0);
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 60 });
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      const index = viewableItems[0].index || 0;
      setActiveBattleIndex(index);
    }
  });

  const activeBattle = battles[activeBattleIndex];

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
                  <Text style={styles.battleDescription}>{item.description}</Text>
                  <Text style={styles.battleMeta}>Expire in : {item.expireIn}</Text>
                  <Text style={styles.battleMeta}>Total vote : {item.totalVote}</Text>
                </View>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={{ width: 20 }} />}
          />
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.opponentCard]}>
            <Text style={[styles.statLabel, styles.statLabelBold]}>Opponent votes</Text>
            <Text style={styles.statValue}>{activeBattle.opponentVotes}</Text>
          </View>
          <View style={[styles.statCard, styles.winRateCard]}>
            <View style={styles.winRateHeader}>
              <Text style={[styles.statLabel, styles.statLabelBold]}>Win Rate</Text>
              <WinRateSvg width={28} height={28} />
            </View>
            <Text style={styles.statValue}>{activeBattle.winRate}</Text>
          </View>
        </View>

        <View style={styles.voteCard}>
          <View>
            <Text style={styles.voteLabel}>Vote</Text>
            <Text style={styles.voteLead}>{activeBattle.voteLead}</Text>
          </View>
          <Text style={styles.voteValue}>{activeBattle.yourVotes}</Text>
        </View>

        {/* Voters */}
        <Text style={styles.sectionTitle}>Voting People</Text>
        <View style={styles.votersList}>
          {activeBattle.voters.map((voter) => (
            <View key={voter.id} style={styles.voterItem}>
              <Image source={{ uri: voter.avatar }} style={styles.voterAvatar} />
              <View style={styles.voterInfo}>
                <Text style={styles.voterName}>{voter.name}</Text>
                <Text style={styles.voterMessage}>{voter.message}</Text>
              </View>
              <Text style={styles.voterTime}>{voter.time}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
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
});

export default BattlesScreen;

