import { getCurrentUser } from './authService';
import { createDocument, getDocument, deleteDocument, COLLECTIONS } from './firestoreService';
import { generateUUID } from '../utils/uuid';
import { sendOTPEmail as sendEmail } from './emailService';

/**
 * OTP Service
 * Handles generation, storage, and verification of 4-digit OTP codes
 */

// OTP expiration time (10 minutes)
const OTP_EXPIRY = 10 * 60 * 1000;

/**
 * Generate a random 4-digit OTP
 * @returns {string} 4-digit OTP code
 */
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

/**
 * Send OTP to user's email
 * @param {string} email - User's email address
 * @param {string} otp - OTP code to send
 * @param {string} purpose - Purpose of OTP (e.g., 'password_change', 'email_change', 'block_account')
 * @returns {Promise<void>}
 */
const sendOTPEmail = async (email, otp, purpose) => {
  try {
    // Store OTP in Firestore for verification
    const otpId = generateUUID();
    await createDocument(
      COLLECTIONS.OTP_CODES,
      {
        email: email,
        code: otp,
        purpose: purpose,
        verified: false,
      },
      otpId
    );

    // Send OTP email only for block_account (uses EmailJS)
    // For password_change and email_change, use Firebase email verification instead
    if (purpose === 'block_account') {
      try {
        const emailSent = await sendEmail(email, otp, purpose);
        if (emailSent) {
          console.log(`✅ OTP email sent successfully to ${email}`);
        }
      } catch (error) {
        console.error('❌ Error sending OTP email:', error);
        // Re-throw the error - email sending is required for block_account
        throw error;
      }
    } else {
      // For other purposes, OTP is stored but email is sent via Firebase
      console.log(`📧 OTP generated for ${purpose} (email verification via Firebase)`);
    }

    console.log(`📧 OTP for ${purpose} generated and stored for ${email}`);

    return otpId;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw error;
  }
};

/**
 * Send OTP to user's registered email
 * @param {string} purpose - Purpose of OTP ('password_change', 'email_change', 'block_account')
 * @returns {Promise<string>} OTP ID for tracking
 */
export const sendOTPToUser = async (purpose) => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.email) {
      throw new Error('No authenticated user or email found');
    }

    const otp = generateOTP();
    const otpId = await sendOTPEmail(currentUser.email, otp, purpose);
    
    return { otpId }; // OTP is sent via email, not returned
  } catch (error) {
    console.error('Error sending OTP to user:', error);
    throw error;
  }
};

/**
 * Send OTP to a specific email address
 * @param {string} email - Email address to send OTP to
 * @param {string} purpose - Purpose of OTP
 * @returns {Promise<string>} OTP ID for tracking
 */
export const sendOTPToEmail = async (email, purpose) => {
  try {
    const otp = generateOTP();
    const otpId = await sendOTPEmail(email, otp, purpose);
    
    return { otpId }; // OTP is sent via email, not returned
  } catch (error) {
    console.error('Error sending OTP to email:', error);
    throw error;
  }
};

/**
 * Verify OTP code
 * @param {string} email - User's email address
 * @param {string} code - OTP code to verify
 * @param {string} purpose - Purpose of OTP
 * @returns {Promise<boolean>} True if OTP is valid
 */
export const verifyOTP = async (email, code, purpose) => {
  try {
    // Get all OTPs for this email and purpose
    const { getDocuments } = await import('./firestoreService');
    const otps = await getDocuments(
      COLLECTIONS.OTP_CODES,
      [
        { field: 'email', operator: '==', value: email },
        { field: 'purpose', operator: '==', value: purpose },
        { field: 'verified', operator: '==', value: false },
      ]
    );

    // Sort by createdAt descending to get the most recent
    otps.sort((a, b) => {
      const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
      const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
      return bTime - aTime;
    });

    if (otps.length === 0) {
      console.log('❌ No OTP found for this email and purpose');
      return false;
    }

    const latestOTP = otps[0];

    // Check if OTP matches
    if (latestOTP.code !== code) {
      console.log('❌ OTP code does not match');
      return false;
    }

    // Check if OTP has expired (10 minutes)
    const now = Date.now();
    const createdAt = latestOTP.createdAt?.toMillis ? latestOTP.createdAt.toMillis() : (latestOTP.createdAt?.seconds ? latestOTP.createdAt.seconds * 1000 : 0);
    if (now - createdAt > OTP_EXPIRY) {
      console.log('❌ OTP has expired');
      // Delete expired OTP
      await deleteDocument(COLLECTIONS.OTP_CODES, latestOTP.id);
      return false;
    }

    // Mark OTP as verified
    const { updateDocument } = await import('./firestoreService');
    await updateDocument(COLLECTIONS.OTP_CODES, latestOTP.id, {
      verified: true,
    });

    // Delete old OTPs for this email/purpose
    for (const otp of otps.slice(1)) {
      await deleteDocument(COLLECTIONS.OTP_CODES, otp.id);
    }

    console.log('✅ OTP verified successfully');
    return true;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return false;
  }
};

/**
 * Clean up expired OTPs (can be called periodically)
 */
export const cleanupExpiredOTPs = async () => {
  try {
    const { getDocuments } = await import('./firestoreService');
    const allOTPs = await getDocuments(COLLECTIONS.OTP_CODES);
    
    const now = Date.now();
    const expiredOTPs = allOTPs.filter((otp) => {
      const createdAt = otp.createdAt?.toMillis ? otp.createdAt.toMillis() : (otp.createdAt?.seconds ? otp.createdAt.seconds * 1000 : 0);
      return now - createdAt > OTP_EXPIRY;
    });

    for (const otp of expiredOTPs) {
      await deleteDocument(COLLECTIONS.OTP_CODES, otp.id);
    }

    console.log(`🧹 Cleaned up ${expiredOTPs.length} expired OTPs`);
  } catch (error) {
    console.error('Error cleaning up expired OTPs:', error);
  }
};

export default {
  sendOTPToUser,
  sendOTPToEmail,
  verifyOTP,
  cleanupExpiredOTPs,
};

