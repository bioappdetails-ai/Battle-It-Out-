import {
  cloudinaryConfig,
  cloudinaryDefaults,
  buildTransformationString,
  cloudinaryBaseUrl,
} from '../config/cloudinary';

/**
 * Cloudinary Service
 * Handles all media uploads (images and videos) to Cloudinary
 */

// Get Cloudinary upload URL
const getUploadUrl = () => {
  const cloudName = cloudinaryConfig.cloudName;
  if (!cloudName || cloudName === 'YOUR_CLOUD_NAME') {
    throw new Error('Cloudinary cloud name is not configured');
  }
  return `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
};

const DEFAULT_IMAGE_FOLDER = cloudinaryDefaults.folders.images;
const DEFAULT_VIDEO_FOLDER = cloudinaryDefaults.folders.videos;
const PROFILE_ROOT_FOLDER = cloudinaryDefaults.folders.profiles;
const THUMBNAIL_ROOT_FOLDER = cloudinaryDefaults.folders.thumbnails;
const DIAGNOSTIC_FOLDERS = cloudinaryDefaults.folders.diagnostics;
const DEFAULT_TRANSFORMS = cloudinaryDefaults.transformations;

const ensureUploadPreset = () => {
  const uploadPreset = cloudinaryConfig.uploadPreset;
  if (!uploadPreset || uploadPreset === 'YOUR_UPLOAD_PRESET') {
    throw new Error(
      'Upload preset not configured. Please create an unsigned upload preset named "battleitout_unsigned" in Cloudinary Dashboard.'
    );
  }
  return uploadPreset;
};

const uploadWithProgress = (formData, onProgress) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', getUploadUrl());

    if (xhr.upload && typeof onProgress === 'function') {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(event.loaded / event.total);
        }
      };
    }

    xhr.onload = () => {
      try {
        const responseJson = JSON.parse(xhr.response);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(responseJson);
        } else {
          const message =
            responseJson?.error?.message ||
            responseJson?.message ||
            'Upload failed';
          const error = new Error(message);
          error.response = responseJson;
          reject(error);
        }
      } catch (parseError) {
        reject(parseError);
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during Cloudinary upload'));
    };

    xhr.send(formData);
  });
};

/**
 * Upload an image to Cloudinary
 * @param {string} imageUri - Local URI of the image
 * @param {string} folder - Cloudinary folder path (optional)
 * @param {Object} options - Additional upload options
 * @returns {Promise<Object>} Upload result with secure_url, public_id, etc.
 */
export const uploadImage = async (
  imageUri,
  folder = DEFAULT_IMAGE_FOLDER,
  options = {}
) => {
  try {
    console.log('📤 Starting image upload to Cloudinary...');
    console.log('📤 Image URI:', imageUri);
    console.log('📤 Folder:', folder);
    console.log('📤 Options:', options);
    
    const formData = new FormData();
    
    // Extract filename from URI
    const filename = imageUri.split('/').pop() || `image_${Date.now()}.jpg`;
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('file', {
      uri: imageUri,
      type: type,
      name: filename,
    });

    // Validate upload preset
    const uploadPreset = ensureUploadPreset();
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', folder);

    // Add additional options
    if (options.resourceType) {
      formData.append('resource_type', options.resourceType);
    }
    console.log('📤 Uploading to Cloudinary');
    const result = await uploadWithProgress(formData, options.onProgress);
    console.log('✅ Image uploaded successfully to Cloudinary!');
    console.log('✅ Secure URL:', result.secure_url);
    console.log('✅ Public ID:', result.public_id);
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error) {
    console.error('❌ Error uploading image to Cloudinary:', error);
    console.error('❌ Error message:', error.message);
    throw error;
  }
};

/**
 * Upload a video to Cloudinary
 * @param {string} videoUri - Local URI of the video
 * @param {string} folder - Cloudinary folder path (optional)
 * @param {Object} options - Additional upload options
 * @returns {Promise<Object>} Upload result with secure_url, public_id, etc.
 */
export const uploadVideo = async (
  videoUri,
  folder = DEFAULT_VIDEO_FOLDER,
  options = {}
) => {
  try {
    const formData = new FormData();
    
    // Extract filename from URI
    const filename = videoUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `video/${match[1]}` : 'video/mp4';

    formData.append('file', {
      uri: videoUri,
      type: type,
      name: filename,
    });

    // Use upload preset if configured
    const uploadPreset = ensureUploadPreset();
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', folder);
    formData.append('resource_type', 'video');

    // Video-specific options
    const result = await uploadWithProgress(formData, options.onProgress);
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      duration: result.duration,
      thumbnailUrl: result.thumbnail_url || result.secure_url.replace(/\.[^/.]+$/, '.jpg'),
    };
  } catch (error) {
    console.error('Error uploading video:', error);
    throw error;
  }
};

/**
 * Upload a profile picture
 * @param {string} imageUri - Local URI of the image
 * @param {string} userId - User ID for folder organization
 * @returns {Promise<Object>} Upload result
 */
const PROFILE_PICTURE_TRANSFORM = { w: 400, h: 400, c: 'fill', g: 'face' };
const THUMBNAIL_TRANSFORM = { w: 800, h: 800, c: 'fill' };

export const uploadProfilePicture = async (imageUri, userId) => {
  console.log('📤 Uploading profile picture for user:', userId);
  const uploadResult = await uploadImage(imageUri, `${PROFILE_ROOT_FOLDER}/${userId}`);
  const optimizedUrl = getOptimizedImageUrl(uploadResult.publicId, PROFILE_PICTURE_TRANSFORM);
  return {
    ...uploadResult,
    rawUrl: uploadResult.url,
    url: optimizedUrl,
  };
};

/**
 * Upload a video thumbnail
 * @param {string} imageUri - Local URI of the thumbnail
 * @param {string} videoId - Video ID for folder organization
 * @returns {Promise<Object>} Upload result
 */
export const uploadVideoThumbnail = async (imageUri, videoId) => {
  const uploadResult = await uploadImage(imageUri, `${THUMBNAIL_ROOT_FOLDER}/${videoId}`);
  const optimizedUrl = getOptimizedImageUrl(uploadResult.publicId, THUMBNAIL_TRANSFORM);
  return {
    ...uploadResult,
    rawUrl: uploadResult.url,
    url: optimizedUrl,
  };
};

/**
 * Get optimized image URL with transformations
 * @param {string} publicId - Public ID of the image
 * @param {Object} transformations - Transformation options
 * @returns {string} Optimized URL
 */
export const getOptimizedImageUrl = (publicId, transformations = {}) => {
  const baseUrl = `${cloudinaryBaseUrl}/image/upload`;
  const transformString = buildTransformationString(transformations);
  
  return transformString
    ? `${baseUrl}/${transformString}/${publicId}`
    : `${baseUrl}/${publicId}`;
};

/**
 * Get optimized video URL with transformations
 * @param {string} publicId - Public ID of the video
 * @param {Object} transformations - Transformation options
 * @returns {string} Optimized URL
 */
export const getOptimizedVideoUrl = (publicId, transformations = {}) => {
  const baseUrl = `${cloudinaryBaseUrl}/video/upload`;
  const transformString = buildTransformationString(transformations);
  
  return transformString
    ? `${baseUrl}/${transformString}/${publicId}`
    : `${baseUrl}/${publicId}`;
};

const HANDLERS = {
  image: {
    uploader: uploadImage,
    urlBuilder: getOptimizedImageUrl,
  },
  video: {
    uploader: uploadVideo,
    urlBuilder: getOptimizedVideoUrl,
  },
};

const resolveDiagnosticsFolder = (assetType, folderOverride) => {
  if (folderOverride) {
    return folderOverride;
  }
  return (
    DIAGNOSTIC_FOLDERS?.[assetType] ||
    (assetType === 'video' ? DEFAULT_VIDEO_FOLDER : DEFAULT_IMAGE_FOLDER)
  );
};

const resolveTransformations = (assetType, overrides = {}) => {
  if (overrides && Object.keys(overrides).length > 0) {
    return overrides;
  }
  return DEFAULT_TRANSFORMS[assetType] || {};
};

const runProbe = async (url, method = 'HEAD') => {
  try {
    const response = await fetch(url, { method });
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: {
        'content-type': response.headers.get('content-type'),
        'content-length': response.headers.get('content-length'),
      },
      method,
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      statusText: null,
      headers: null,
      method,
      error: error.message,
    };
  }
};

const probeUrl = async (url) => {
  const headResult = await runProbe(url, 'HEAD');
  if (headResult.ok) {
    return { ...headResult, url };
  }

  const getResult = await runProbe(url, 'GET');
  return { ...getResult, url };
};

export const uploadAndVerifyAsset = async ({
  assetUri,
  assetType = 'image',
  folder,
  transformations,
} = {}) => {
  if (!assetUri) {
    throw new Error('assetUri is required to upload to Cloudinary');
  }

  const handler = HANDLERS[assetType];
  if (!handler) {
    throw new Error(`Unsupported asset type: ${assetType}`);
  }

  const resolvedFolder = resolveDiagnosticsFolder(assetType, folder);
  const startedAt = new Date().toISOString();

  const uploadResult = await handler.uploader(assetUri, resolvedFolder);
  const optimizedUrl = handler.urlBuilder(
    uploadResult.publicId,
    resolveTransformations(assetType, transformations)
  );

  const directProbe = await probeUrl(uploadResult.url);
  const optimizedProbe = await probeUrl(optimizedUrl);

  return {
    startedAt,
    completedAt: new Date().toISOString(),
    assetType,
    folder: resolvedFolder,
    upload: uploadResult,
    verification: {
      direct: directProbe,
      optimized: optimizedProbe,
    },
  };
};

export const verifyExistingAsset = async ({
  publicId,
  assetType = 'image',
  transformations,
} = {}) => {
  if (!publicId) {
    throw new Error('publicId is required to verify Cloudinary asset access');
  }

  const handler = HANDLERS[assetType];
  if (!handler) {
    throw new Error(`Unsupported asset type: ${assetType}`);
  }

  const optimizedUrl = handler.urlBuilder(
    publicId,
    resolveTransformations(assetType, transformations)
  );
  const probeResult = await probeUrl(optimizedUrl);

  return {
    checkedAt: new Date().toISOString(),
    assetType,
    publicId,
    url: optimizedUrl,
    reachable: probeResult.ok,
    probe: probeResult,
  };
};

export const runCloudinaryDiagnostic = async ({
  assetUri,
  publicId,
  assetType = 'image',
  folder,
  transformations,
} = {}) => {
  if (!assetUri && !publicId) {
    throw new Error('Provide assetUri, publicId, or both to run diagnostics');
  }

  const report = {
    startedAt: new Date().toISOString(),
    assetType,
    steps: {},
  };

  if (assetUri) {
    report.steps.upload = await uploadAndVerifyAsset({
      assetUri,
      assetType,
      folder,
      transformations,
    });
  }

  if (publicId) {
    report.steps.verifyExisting = await verifyExistingAsset({
      publicId,
      assetType,
      transformations,
    });
  }

  report.completedAt = new Date().toISOString();
  return report;
};

export default {
  uploadImage,
  uploadVideo,
  uploadProfilePicture,
  uploadVideoThumbnail,
  getOptimizedImageUrl,
  getOptimizedVideoUrl,
  uploadAndVerifyAsset,
  verifyExistingAsset,
  runCloudinaryDiagnostic,
};

