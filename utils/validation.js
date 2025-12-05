/**
 * Validation Utilities
 * Provides input validation functions throughout the app
 */

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export const validatePassword = (password) => {
  const errors = [];

  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (password && password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }

  return {
    valid: errors.length === 0,
    errors: errors,
  };
};

/**
 * Validate username
 * @param {string} username - Username to validate
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export const validateUsername = (username) => {
  const errors = [];

  if (!username || username.trim().length === 0) {
    errors.push('Username is required');
  } else {
    if (username.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }
    if (username.length > 30) {
      errors.push('Username must be less than 30 characters');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.push('Username can only contain letters, numbers, and underscores');
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors,
  };
};

/**
 * Validate video title
 * @param {string} title - Video title to validate
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export const validateVideoTitle = (title) => {
  const errors = [];

  if (!title || title.trim().length === 0) {
    errors.push('Title is required');
  } else {
    if (title.length > 100) {
      errors.push('Title must be less than 100 characters');
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors,
  };
};

/**
 * Validate video description
 * @param {string} description - Video description to validate
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export const validateVideoDescription = (description) => {
  const errors = [];

  if (!description || description.trim().length === 0) {
    errors.push('Description is required');
  } else {
    if (description.length > 500) {
      errors.push('Description must be less than 500 characters');
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors,
  };
};

/**
 * Validate comment text
 * @param {string} text - Comment text to validate
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export const validateComment = (text) => {
  const errors = [];

  if (!text || text.trim().length === 0) {
    errors.push('Comment cannot be empty');
  } else {
    if (text.length > 500) {
      errors.push('Comment must be less than 500 characters');
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors,
  };
};

/**
 * Sanitize input text (remove dangerous characters)
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
export const sanitizeInput = (text) => {
  if (!text || typeof text !== 'string') {
    return '';
  }
  // Remove potentially dangerous characters but keep basic punctuation
  return text.trim().replace(/[<>]/g, '');
};

export default {
  isValidEmail,
  validatePassword,
  validateUsername,
  validateVideoTitle,
  validateVideoDescription,
  validateComment,
  sanitizeInput,
};



