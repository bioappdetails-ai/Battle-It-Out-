import { createDocument, getDocuments, COLLECTIONS } from './firestoreService';
import { generateUUID } from '../utils/uuid';
import { serverTimestamp } from 'firebase/firestore';
import { getCurrentUser } from './authService';

/**
 * Report Service
 * Handles video reporting functionality
 */

/**
 * Report a video
 * @param {string} videoId - ID of the video being reported
 * @param {string} reason - Reason for reporting
 * @param {string} videoType - Type of video: 'video' or 'battle'
 * @param {string} battleId - Optional battle ID if reporting a battle video
 * @returns {Promise<void>}
 */
export const reportVideo = async (videoId, reason, videoType = 'video', battleId = null) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User must be logged in to report a video');
    }

    if (!videoId || !reason || !reason.trim()) {
      throw new Error('Video ID and reason are required');
    }

    const reportId = generateUUID();
    const reportData = {
      id: reportId,
      reporterId: currentUser.uid,
      videoId: videoId,
      videoType: videoType, // 'video' or 'battle'
      battleId: battleId,
      reason: reason.trim(),
      status: 'pending', // pending, reviewed, resolved
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await createDocument(COLLECTIONS.REPORTS, reportData, reportId);
    console.log('✅ Video reported successfully');
  } catch (error) {
    console.error('Error reporting video:', error);
    throw error;
  }
};

/**
 * Get all reports for a user (to filter out reported videos)
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of reported video IDs
 */
export const getUserReports = async (userId) => {
  try {
    const reports = await getDocuments(
      COLLECTIONS.REPORTS,
      [{ field: 'reporterId', operator: '==', value: userId }]
    );

    // Return set of reported video IDs
    const reportedVideoIds = new Set();
    reports.forEach((report) => {
      if (report.videoId) {
        reportedVideoIds.add(report.videoId);
      }
      // Also add battle ID if it's a battle report
      if (report.videoType === 'battle' && report.battleId) {
        reportedVideoIds.add(report.battleId);
      }
    });

    return Array.from(reportedVideoIds);
  } catch (error) {
    console.error('Error fetching user reports:', error);
    return [];
  }
};

