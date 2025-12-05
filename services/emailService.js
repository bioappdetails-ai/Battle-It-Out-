/**
 * Email Service
 * Handles sending emails for OTP verification using EmailJS
 * 
 * IMPORTANT: Firebase Auth does NOT support sending custom OTP emails.
 * EmailJS works client-side without needing a domain or server.
 */

import { send, EmailJSResponseStatus } from '@emailjs/react-native';

// EmailJS Configuration
// Get these from: https://dashboard.emailjs.com/admin
// Read raw values first for debugging
const RAW_SERVICE_ID = process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID;
const RAW_TEMPLATE_ID = process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID;
const RAW_PUBLIC_KEY = process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY;
const RAW_PRIVATE_KEY = process.env.EXPO_PUBLIC_EMAILJS_PRIVATE_KEY;

// Trim values to remove any whitespace that might cause issues
const EMAILJS_SERVICE_ID = RAW_SERVICE_ID ? String(RAW_SERVICE_ID).trim() : null;
const EMAILJS_TEMPLATE_ID = RAW_TEMPLATE_ID ? String(RAW_TEMPLATE_ID).trim() : null;
const EMAILJS_PUBLIC_KEY = RAW_PUBLIC_KEY ? String(RAW_PUBLIC_KEY).trim() : null;
const EMAILJS_PRIVATE_KEY = RAW_PRIVATE_KEY ? String(RAW_PRIVATE_KEY).trim() : null;

// Debug: Log raw values (first 5 chars only for security)
console.log('🔍 EmailJS Environment Variables Debug:');
console.log('  RAW_SERVICE_ID:', RAW_SERVICE_ID ? `${RAW_SERVICE_ID.substring(0, 5)}... (length: ${RAW_SERVICE_ID.length})` : 'undefined');
console.log('  RAW_TEMPLATE_ID:', RAW_TEMPLATE_ID ? `${RAW_TEMPLATE_ID.substring(0, 5)}... (length: ${RAW_TEMPLATE_ID.length})` : 'undefined');
console.log('  RAW_PUBLIC_KEY:', RAW_PUBLIC_KEY ? `${RAW_PUBLIC_KEY.substring(0, 5)}... (length: ${RAW_PUBLIC_KEY.length})` : 'undefined');
console.log('  RAW_PRIVATE_KEY:', RAW_PRIVATE_KEY ? `${RAW_PRIVATE_KEY.substring(0, 5)}... (length: ${RAW_PRIVATE_KEY.length})` : 'undefined');
console.log('  Processed PRIVATE_KEY:', EMAILJS_PRIVATE_KEY ? `${EMAILJS_PRIVATE_KEY.substring(0, 5)}... (length: ${EMAILJS_PRIVATE_KEY.length})` : 'null/empty');

// Note: No initialization needed with @emailjs/react-native
// The send function is used directly with publicKey in options

// Debug: Log configuration status
if (EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY) {
  console.log('✅ EmailJS fully configured');
  console.log('✅ Service ID:', EMAILJS_SERVICE_ID);
  console.log('✅ Template ID:', EMAILJS_TEMPLATE_ID);
  console.log('✅ Public Key: Configured');
  if (EMAILJS_PRIVATE_KEY) {
    console.log('✅ Private Key: Configured (for strict mode)');
  } else {
    console.log('⚠️ Private Key: Not configured (using public key only)');
  }
} else {
  console.warn('⚠️ EmailJS not fully configured');
  if (!EMAILJS_SERVICE_ID) console.warn('  - Missing: EXPO_PUBLIC_EMAILJS_SERVICE_ID');
  if (!EMAILJS_TEMPLATE_ID) console.warn('  - Missing: EXPO_PUBLIC_EMAILJS_TEMPLATE_ID');
  if (!EMAILJS_PUBLIC_KEY) {
    console.warn('  - Missing: EXPO_PUBLIC_EMAILJS_PUBLIC_KEY (required)');
  }
}

/**
 * Send OTP email using EmailJS
 * @param {string} to - Recipient email
 * @param {string} otp - OTP code
 * @param {string} purpose - Purpose of OTP
 * @returns {Promise<boolean>}
 */
export const sendOTPEmail = async (to, otp, purpose) => {
  // Public key is required for initialization, even when using private key
  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
    const missing = [];
    if (!EMAILJS_SERVICE_ID) missing.push('EXPO_PUBLIC_EMAILJS_SERVICE_ID');
    if (!EMAILJS_TEMPLATE_ID) missing.push('EXPO_PUBLIC_EMAILJS_TEMPLATE_ID');
    if (!EMAILJS_PUBLIC_KEY) missing.push('EXPO_PUBLIC_EMAILJS_PUBLIC_KEY (required)');
    
    const errorMessage = `
❌ EmailJS not fully configured!

Missing: ${missing.join(', ')}

To complete setup:
1. Go to https://dashboard.emailjs.com/admin
2. Get your Template ID from "Email Templates" section
3. Get your Public Key from "Account" → "General" → "API Keys" (required)
4. Get your Private Key from "Account" → "General" → "API Keys" (for strict mode)
5. Add to .env file:
   EXPO_PUBLIC_EMAILJS_SERVICE_ID=${EMAILJS_SERVICE_ID || 'your_service_id'}
   EXPO_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id
   EXPO_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key (required)
   EXPO_PUBLIC_EMAILJS_PRIVATE_KEY=your_private_key (for strict mode)

See EMAIL_SETUP.md for detailed instructions.
    `;
    console.error(errorMessage);
    throw new Error(`EmailJS not fully configured. Missing: ${missing.join(', ')}`);
  }

  console.log('📧 Sending OTP email via EmailJS...');
  console.log('📧 To:', to);
  console.log('📧 Purpose:', purpose);

  const purposeText = {
    password_change: 'Password Change',
    email_change: 'Email Change',
    block_account: 'Account Blocking',
  }[purpose] || 'Verification';

  try {
    const templateParams = {
      email: to,  // Changed from 'to_email' to 'email' to match EmailJS template
      otp_code: otp,
      purpose: purposeText,
      app_name: 'Battle It Out',
    };

    // Use private key if available (for strict mode), otherwise use public key
    // In strict mode, only pass private key (public key is already initialized)
    // Trim and validate keys to ensure they're not empty strings
    const privateKey = EMAILJS_PRIVATE_KEY ? String(EMAILJS_PRIVATE_KEY).trim() : null;
    const publicKey = EMAILJS_PUBLIC_KEY ? String(EMAILJS_PUBLIC_KEY).trim() : null;
    
    if (!publicKey) {
      throw new Error('EmailJS Public Key is required but not configured');
    }
    
    // Debug: Log key validation
    console.log('🔍 Key Validation Before Send:');
    console.log('  EMAILJS_PRIVATE_KEY (raw):', EMAILJS_PRIVATE_KEY ? `exists (length: ${EMAILJS_PRIVATE_KEY.length})` : 'null/undefined');
    console.log('  privateKey (trimmed):', privateKey ? `exists (length: ${privateKey.length})` : 'null/empty');
    console.log('  publicKey (trimmed):', publicKey ? `exists (length: ${publicKey.length})` : 'null/empty');
    
    // For strict mode: pass both keys in options
    // For non-strict mode: pass publicKey only
    // According to official docs, use publicKey in options
    // For strict mode, also include privateKey (or accessToken)
    const options = privateKey && privateKey.length > 0
      ? { publicKey: publicKey, privateKey: privateKey }
      : { publicKey: publicKey };

    // Debug: Log what we're sending (without exposing full keys)
    console.log('📧 EmailJS Send Options:', {
      hasPrivateKey: !!(options.privateKey),
      privateKeyLength: options.privateKey?.length || 0,
      privateKeyFirstChars: options.privateKey ? options.privateKey.substring(0, 5) : 'N/A',
      hasPublicKey: !!(options.publicKey),
      publicKeyLength: options.publicKey?.length || 0,
      optionsKeys: Object.keys(options),
    });

    const response = await send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      options
    );

    console.log('✅ Email sent successfully via EmailJS');
    console.log('✅ Response:', response.text);
    console.log('✅ Recipient:', to);
    return true;
  } catch (error) {
    console.error('❌ Error sending email via EmailJS:', error);
    
    // Handle EmailJSResponseStatus errors
    if (error instanceof EmailJSResponseStatus) {
      console.error('❌ EmailJS Request Failed:', error);
      console.error('❌ Status:', error.status);
      console.error('❌ Text:', error.text);
    } else {
      console.error('❌ Error details:', error.text || error.message);
      if (error.status) {
        console.error('❌ Status code:', error.status);
      }
    }
    throw error;
  }
};

export default {
  sendOTPEmail,
};
