import { getDocuments, getDocument, updateDocument, COLLECTIONS, timestampToDate } from './firestoreService';
import { createNotification } from './notificationService';
import { incrementField } from './firestoreService';
import { serverTimestamp } from 'firebase/firestore';

/**
 * Battle Service
 * Handles battle-related operations including expiration and winner determination
 */

const BATTLE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Check if a battle has expired
 * @param {Object} battle - Battle document
 * @returns {boolean} True if battle has expired
 */
export const isBattleExpired = (battle) => {
  if (!battle || !battle.createdAt) {
    return false;
  }

  try {
    const createdDate = timestampToDate(battle.createdAt);
    if (!createdDate) return false;

    const now = Date.now();
    const battleEndTime = createdDate.getTime() + BATTLE_DURATION_MS;
    return now >= battleEndTime;
  } catch (error) {
    console.error('Error checking battle expiration:', error);
    return false;
  }
};

/**
 * Determine battle winner based on votes
 * @param {Object} battle - Battle document
 * @returns {string|null} Winner user ID or null if tie
 */
export const determineBattleWinner = (battle) => {
  const player1Votes = battle.player1Votes || 0;
  const player2Votes = battle.player2Votes || 0;

  if (player1Votes > player2Votes) {
    return battle.player1UserId;
  } else if (player2Votes > player1Votes) {
    return battle.player2UserId;
  }
  return null; // Tie
};

/**
 * Complete a battle and determine winner
 * @param {string} battleId - Battle ID
 * @returns {Promise<Object>} Updated battle with winner
 */
export const completeBattle = async (battleId) => {
  try {
    const battle = await getDocument(COLLECTIONS.BATTLES, battleId);
    if (!battle) {
      throw new Error('Battle not found');
    }

    if (battle.status === 'completed' || battle.status === 'expired') {
      return battle; // Already completed
    }

    const winnerId = determineBattleWinner(battle);
    
    // Update battle status
    const updateData = {
      status: 'completed',
      winnerId: winnerId,
      completedAt: serverTimestamp(),
    };

    await updateDocument(COLLECTIONS.BATTLES, battleId, updateData);

    // Update user battle statistics
    if (battle.player1UserId) {
      await incrementField(COLLECTIONS.USERS, battle.player1UserId, 'totalBattles', 1);
      if (winnerId === battle.player1UserId) {
        await incrementField(COLLECTIONS.USERS, battle.player1UserId, 'battlesWon', 1);
      }
    }

    if (battle.player2UserId) {
      await incrementField(COLLECTIONS.USERS, battle.player2UserId, 'totalBattles', 1);
      if (winnerId === battle.player2UserId) {
        await incrementField(COLLECTIONS.USERS, battle.player2UserId, 'battlesWon', 1);
      }
    }

    // Send notifications to both players
    try {
      const opponent1Name = battle.player1UserName || 'Opponent';
      const opponent2Name = battle.player2UserName || 'Opponent';

      if (battle.player1UserId) {
        await createNotification(battle.player1UserId, 'battle_expired', {
          battleId: battleId,
          opponentName: opponent2Name,
          winnerId: winnerId,
          isWinner: winnerId === battle.player1UserId,
        });
      }

      if (battle.player2UserId) {
        await createNotification(battle.player2UserId, 'battle_expired', {
          battleId: battleId,
          opponentName: opponent1Name,
          winnerId: winnerId,
          isWinner: winnerId === battle.player2UserId,
        });
      }
    } catch (error) {
      console.error('Error sending battle completion notifications:', error);
      // Don't fail the battle completion if notifications fail
    }

    return { ...battle, ...updateData };
  } catch (error) {
    console.error('Error completing battle:', error);
    throw error;
  }
};

/**
 * Expire a battle (mark as expired without determining winner)
 * @param {string} battleId - Battle ID
 * @returns {Promise<void>}
 */
export const expireBattle = async (battleId) => {
  try {
    const battle = await getDocument(COLLECTIONS.BATTLES, battleId);
    if (!battle) {
      return;
    }

    if (battle.status === 'completed' || battle.status === 'expired') {
      return; // Already expired or completed
    }

    await updateDocument(COLLECTIONS.BATTLES, battleId, {
      status: 'expired',
      expiredAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error expiring battle:', error);
  }
};

/**
 * Check and process expired battles
 * This should be called periodically (e.g., via Cloud Function or scheduled task)
 * @param {number} limit - Maximum number of battles to process
 * @returns {Promise<number>} Number of battles processed
 */
export const processExpiredBattles = async (limit = 50) => {
  try {
    // Fetch active battles that might be expired
    const activeBattles = await getDocuments(
      COLLECTIONS.BATTLES,
      [
        { field: 'status', operator: '==', value: 'active' },
      ],
      'createdAt',
      'asc', // Oldest first
      limit
    );

    let processedCount = 0;

    for (const battle of activeBattles) {
      if (isBattleExpired(battle)) {
        try {
          await completeBattle(battle.id);
          processedCount++;
        } catch (error) {
          console.error(`Error processing expired battle ${battle.id}:`, error);
        }
      }
    }

    console.log(`✅ Processed ${processedCount} expired battles`);
    return processedCount;
  } catch (error) {
    console.error('Error processing expired battles:', error);
    return 0;
  }
};

/**
 * Get battle feed by category
 * @param {string} category - Category name ('New', 'Trending', or specific category)
 * @param {number} limit - Maximum number of battles to return
 * @returns {Promise<Array>} Array of battles
 */
export const getBattleFeedByCategory = async (category = 'New', limit = 20) => {
  try {
    let battles = [];

    if (category === 'New') {
      // Get newest battles
      battles = await getDocuments(
        COLLECTIONS.BATTLES,
        [{ field: 'status', operator: '==', value: 'active' }],
        'createdAt',
        'desc',
        limit
      );
    } else if (category === 'Trending') {
      // Get battles with most votes (trending)
      battles = await getDocuments(
        COLLECTIONS.BATTLES,
        [{ field: 'status', operator: '==', value: 'active' }],
        'totalVotes',
        'desc',
        limit
      );
    } else if (category === 'Game Battles') {
      // Get battles in game-related categories
      const gameCategories = ['Sports', 'Racing', 'Gym', 'Swimming'];
      battles = await getDocuments(
        COLLECTIONS.BATTLES,
        [
          { field: 'status', operator: '==', value: 'active' },
          { field: 'category', operator: 'in', value: gameCategories },
        ],
        'createdAt',
        'desc',
        limit
      );
    } else {
      // Get battles by specific category
      battles = await getDocuments(
        COLLECTIONS.BATTLES,
        [
          { field: 'status', operator: '==', value: 'active' },
          { field: 'category', operator: '==', value: category },
        ],
        'createdAt',
        'desc',
        limit
      );
    }

    return battles;
  } catch (error) {
    console.error('Error fetching battle feed by category:', error);
    return [];
  }
};

export default {
  isBattleExpired,
  determineBattleWinner,
  completeBattle,
  expireBattle,
  processExpiredBattles,
  getBattleFeedByCategory,
};

