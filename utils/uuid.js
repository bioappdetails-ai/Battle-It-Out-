import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a UUID v4
 * @returns {string} A new UUID v4 string
 */
export const generateUUID = () => {
  return uuidv4();
};

/**
 * Generate UUID for different data types
 * Used throughout the application for consistent ID generation
 */
export const generateUserId = () => generateUUID();
export const generateBattleId = () => generateUUID();
export const generateMessageId = () => generateUUID();
export const generateNotificationId = () => generateUUID();
export const generateVideoId = () => generateUUID();
export const generateCommentId = () => generateUUID();
export const generateVoteId = () => generateUUID();

export default generateUUID;



