import { getCurrentUser } from './authService';
import { createDocument, getDocuments, deleteDocument, updateDocument, COLLECTIONS, serverTimestamp } from './firestoreService';
import { generateUUID } from '../utils/uuid';
import { incrementField } from './firestoreService';

/**
 * Comment Service
 * Handles video comment operations
 */

/**
 * Create a comment on a video
 * @param {string} videoId - Video ID
 * @param {string} text - Comment text
 * @returns {Promise<string>} Comment ID
 */
export const createComment = async (videoId, text) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User must be logged in to comment');
    }

    if (!videoId || !text || !text.trim()) {
      throw new Error('Video ID and comment text are required');
    }

    // Get user profile for comment
    const { getDocument } = await import('./firestoreService');
    let userProfile = null;
    try {
      userProfile = await getDocument(COLLECTIONS.USERS, currentUser.uid);
    } catch (error) {
      console.error('Error fetching user profile for comment:', error);
    }

    const commentId = generateUUID();
    const commentData = {
      videoId: videoId,
      userId: currentUser.uid,
      userName: userProfile?.userName || userProfile?.displayName || currentUser.displayName || 'Unknown',
      userAvatar: userProfile?.profileImage || null,
      text: text.trim(),
      likes: 0,
      createdAt: serverTimestamp(),
    };

    await createDocument(COLLECTIONS.COMMENTS, commentData, commentId);

    // Increment comment count on video
    await incrementField(COLLECTIONS.VIDEOS, videoId, 'commentsCount', 1);

    console.log(`✅ Comment created for video ${videoId}`);
    return commentId;
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
};

/**
 * Get comments for a video
 * @param {string} videoId - Video ID
 * @param {number} limit - Maximum number of comments to return
 * @returns {Promise<Array>} Array of comments
 */
export const getVideoComments = async (videoId, limit = 50) => {
  try {
    const comments = await getDocuments(
      COLLECTIONS.COMMENTS,
      [{ field: 'videoId', operator: '==', value: videoId }],
      'createdAt',
      'desc',
      limit
    );

    return comments;
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
};

/**
 * Delete a comment
 * @param {string} commentId - Comment ID
 * @param {string} videoId - Video ID (to decrement count)
 * @returns {Promise<void>}
 */
export const deleteComment = async (commentId, videoId) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User must be logged in to delete comments');
    }

    // Get comment to verify ownership
    const { getDocument } = await import('./firestoreService');
    const comment = await getDocument(COLLECTIONS.COMMENTS, commentId);

    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.userId !== currentUser.uid) {
      throw new Error('You can only delete your own comments');
    }

    await deleteDocument(COLLECTIONS.COMMENTS, commentId);

    // Decrement comment count on video
    if (videoId) {
      await incrementField(COLLECTIONS.VIDEOS, videoId, 'commentsCount', -1);
    }

    console.log(`✅ Comment deleted: ${commentId}`);
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

/**
 * Like a comment
 * @param {string} commentId - Comment ID
 * @returns {Promise<void>}
 */
export const likeComment = async (commentId) => {
  try {
    await incrementField(COLLECTIONS.COMMENTS, commentId, 'likes', 1);
  } catch (error) {
    console.error('Error liking comment:', error);
    throw error;
  }
};

export default {
  createComment,
  getVideoComments,
  deleteComment,
  likeComment,
};

