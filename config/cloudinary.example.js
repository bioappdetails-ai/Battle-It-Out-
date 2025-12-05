// Cloudinary Configuration Example
// Copy this file to cloudinary.js and fill in your Cloudinary credentials
// You can find these in Cloudinary Dashboard > Settings > Upload

export const cloudinaryConfig = {
  cloudName: "YOUR_CLOUD_NAME",
  apiKey: "YOUR_API_KEY",
  apiSecret: "YOUR_API_SECRET", // Note: In production, keep this server-side only
  uploadPreset: "YOUR_UPLOAD_PRESET", // Optional: Create an unsigned upload preset
};

// Base URL for Cloudinary transformations
export const cloudinaryBaseUrl = `https://res.cloudinary.com/${cloudinaryConfig.cloudName}`;

export default cloudinaryConfig;





