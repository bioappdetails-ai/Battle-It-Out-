import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  arrayRemove,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';
import { generateUUID } from '../utils/uuid';

/**
 * Firestore Service
 * Handles all Firestore database operations
 */

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  BATTLES: 'battles',
  VIDEOS: 'videos',
  MESSAGES: 'messages',
  NOTIFICATIONS: 'notifications',
  VOTES: 'votes',
  COMMENTS: 'comments',
  FOLLOWS: 'follows',
  CONVERSATIONS: 'conversations',
  SAVED_VIDEOS: 'savedVideos',
  OTP_CODES: 'otp_codes',
  VIEWS: 'views',
  REPORTS: 'reports',
};

/**
 * Create a new document in a collection
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID (optional, will generate UUID if not provided)
 * @param {Object} data - Document data
 * @returns {Promise<void>}
 */
export const createDocument = async (collectionName, data, docId = null) => {
  try {
    const id = docId || generateUUID();
    const docRef = doc(db, collectionName, id);
    
    const documentData = {
      ...data,
      id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    console.log(`📝 Creating document in ${collectionName} with ID: ${id}`);
    console.log('📝 Document data:', documentData);
    
    await setDoc(docRef, documentData);
    
    console.log(`✅ Document created successfully in ${collectionName}`);
    return id;
  } catch (error) {
    console.error(`❌ Error creating document in ${collectionName}:`, error);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error message:', error.message);
    throw error;
  }
};

/**
 * Get a document by ID
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @returns {Promise<Object|null>}
 */
export const getDocument = async (collectionName, docId) => {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    throw error;
  }
};

/**
 * Update a document
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @param {Object} data - Data to update
 * @returns {Promise<void>}
 */
export const updateDocument = async (collectionName, docId, data) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Delete a document
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @returns {Promise<void>}
 */
export const deleteDocument = async (collectionName, docId) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    throw error;
  }
};

/**
 * Get all documents from a collection
 * @param {string} collectionName - Name of the collection
 * @param {Array} whereConditions - Array of where conditions [{field, operator, value}]
 * @param {string} orderByField - Field to order by
 * @param {string} orderDirection - 'asc' or 'desc'
 * @param {number} limitCount - Maximum number of documents to return
 * @returns {Promise<Array>}
 */
export const getDocuments = async (
  collectionName,
  whereConditions = [],
  orderByField = null,
  orderDirection = 'desc',
  limitCount = null
) => {
  try {
    let q = collection(db, collectionName);

    // Apply where conditions
    whereConditions.forEach((condition) => {
      q = query(q, where(condition.field, condition.operator, condition.value));
    });

    // Apply order by
    if (orderByField) {
      q = query(q, orderBy(orderByField, orderDirection));
    }

    // Apply limit
    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    const querySnapshot = await getDocs(q);
    const documents = [];
    querySnapshot.forEach((doc) => {
      documents.push({ id: doc.id, ...doc.data() });
    });

    return documents;
  } catch (error) {
    throw error;
  }
};

/**
 * Listen to real-time updates for a document
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @param {Function} callback - Callback function that receives the document data
 * @returns {Function} Unsubscribe function
 */
export const subscribeToDocument = (collectionName, docId, callback) => {
  const docRef = doc(db, collectionName, docId);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() });
    } else {
      callback(null);
    }
  });
};

/**
 * Listen to real-time updates for a collection
 * @param {string} collectionName - Name of the collection
 * @param {Array} whereConditions - Array of where conditions
 * @param {string} orderByField - Field to order by
 * @param {string} orderDirection - 'asc' or 'desc'
 * @param {Function} callback - Callback function that receives the documents array
 * @returns {Function} Unsubscribe function
 */
export const subscribeToCollection = (
  collectionName,
  callback,
  whereConditions = [],
  orderByField = null,
  orderDirection = 'desc'
) => {
  let q = collection(db, collectionName);

  whereConditions.forEach((condition) => {
    q = query(q, where(condition.field, condition.operator, condition.value));
  });

  if (orderByField) {
    q = query(q, orderBy(orderByField, orderDirection));
  }

  return onSnapshot(
    q,
    (querySnapshot) => {
      const documents = [];
      querySnapshot.forEach((doc) => {
        documents.push({ id: doc.id, ...doc.data() });
      });
      // Wrap callback in try-catch to handle async callbacks and errors
      try {
        const result = callback(documents);
        // If callback returns a promise, catch any errors
        if (result && typeof result.catch === 'function') {
          result.catch((error) => {
            console.error('Error in subscribeToCollection callback:', error);
          });
        }
      } catch (error) {
        console.error('Error in subscribeToCollection callback:', error);
      }
    },
    (error) => {
      console.error('Error in subscribeToCollection snapshot:', error);
    }
  );
};

/**
 * Add an item to an array field
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @param {string} field - Array field name
 * @param {*} value - Value to add
 * @returns {Promise<void>}
 */
export const addToArray = async (collectionName, docId, field, value) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      [field]: arrayUnion(value),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Remove an item from an array field
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @param {string} field - Array field name
 * @param {*} value - Value to remove
 * @returns {Promise<void>}
 */
export const removeFromArray = async (collectionName, docId, field, value) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      [field]: arrayRemove(value),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Increment a numeric field
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @param {string} field - Numeric field name
 * @param {number} amount - Amount to increment (default: 1)
 * @returns {Promise<void>}
 */
export const incrementField = async (collectionName, docId, field, amount = 1) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      [field]: increment(amount),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Convert Firestore Timestamp to JavaScript Date
 * @param {Timestamp} timestamp - Firestore Timestamp
 * @returns {Date|null}
 */
export const timestampToDate = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp.toDate) {
    return timestamp.toDate();
  }
  return new Date(timestamp);
};

// Export serverTimestamp for use in other services
export { serverTimestamp };

export default {
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  getDocuments,
  subscribeToDocument,
  subscribeToCollection,
  addToArray,
  removeFromArray,
  incrementField,
  timestampToDate,
  COLLECTIONS,
  serverTimestamp,
};

