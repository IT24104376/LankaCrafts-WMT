import streamifier from 'streamifier';
import cloudinary from '../config/cloudinary.js';

/**
 * Extract public_id from a Cloudinary URL.
 * Supports standard Cloudinary URL structures.
 */
export function getCloudinaryPublicId(url) {
  if (!url || !url.includes('cloudinary.com')) return null;
  
  // Standard format: https://res.cloudinary.com/demo/image/upload/v1234/folder/public_id.jpg
  const parts = url.split('/');
  const uploadIndex = parts.indexOf('upload');
  if (uploadIndex === -1) return null;

  let startIndex = uploadIndex + 1;
  // Skip version part if present (e.g., v12345678)
  if (parts[startIndex].match(/^v\d+$/)) {
    startIndex += 1;
  }

  const publicIdWithExt = parts.slice(startIndex).join('/');
  // Remove extension
  const lastDotIndex = publicIdWithExt.lastIndexOf('.');
  return lastDotIndex !== -1 ? publicIdWithExt.substring(0, lastDotIndex) : publicIdWithExt;
}

/**
 * Upload a raw buffer to Cloudinary and return the full result object.
 */
export function uploadBufferToCloudinary(buffer, folder, resourceType = 'auto') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

/**
 * Delete one or more resources from Cloudinary by their public IDs.
 */
export async function deleteFromCloudinary(publicIds) {
  const ids = Array.isArray(publicIds) ? publicIds : [publicIds];
  const results = [];
  
  for (const id of ids) {
    if (!id) continue;
    try {
      const res = await cloudinary.uploader.destroy(id);
      results.push({ id, status: res.result });
    } catch (err) {
      console.error(`[CloudinaryHelper] Delete failed for ID: ${id}`, err.message);
      results.push({ id, status: 'failed', error: err.message });
    }
  }
  return results;
}

/**
 * Helper to delete a resource directly using its URL.
 */
export async function deleteByUrl(url) {
  const publicId = getCloudinaryPublicId(url);
  if (!publicId) return null;
  return deleteFromCloudinary(publicId);
}
