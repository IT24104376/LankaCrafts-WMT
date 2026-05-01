import streamifier from 'streamifier';
import cloudinary from '../config/cloudinary.js';
import Tourist from '../models/Tourist.js';
import Blog from '../models/Blog.js';
import Booking from '../models/workshopBooking.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Extract public_id from a Cloudinary URL.
 */
function getCloudinaryPublicId(url) {
  if (!url || !url.includes('cloudinary.com')) return null;
  const parts = url.split('/');
  const uploadIndex = parts.indexOf('upload');
  if (uploadIndex === -1) return null;

  let startIndex = uploadIndex + 1;
  if (parts[startIndex].match(/^v\d+$/)) {
    startIndex += 1;
  }

  const publicIdWithExt = parts.slice(startIndex).join('/');
  return publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.'));
}

/**
 * Upload a buffer to Cloudinary.
 */
function uploadBufferToCloudinary(buffer, folder, resourceType = 'auto') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Return the tourist's full profile (already on req.tourist, but exposed here for uniformity).
 */
export async function getProfile(touristId) {
  return Tourist.findById(touristId);
}

/**
 * Update allowed fields of a tourist profile.
 */
export async function updateProfile(touristId, updates) {
  return Tourist.findByIdAndUpdate(
    touristId,
    { $set: updates },
    { new: true }
  );
}

/**
 * Upload a new profile picture to Cloudinary, delete the old one, and update the DB.
 */
export async function uploadProfilePicture(tourist, fileBuffer) {
  // Delete old image from Cloudinary if present
  if (tourist.profilePicUrl) {
    const oldPublicId = getCloudinaryPublicId(tourist.profilePicUrl);
    if (oldPublicId) {
      try {
        await cloudinary.uploader.destroy(oldPublicId);
      } catch (delErr) {
        console.error('Failed to delete old image from Cloudinary:', delErr);
      }
    }
  }

  const result = await uploadBufferToCloudinary(fileBuffer, 'lankacrafts/users', 'image');

  const updated = await Tourist.findByIdAndUpdate(
    tourist._id,
    { $set: { profilePicUrl: result.secure_url } },
    { new: true }
  );

  return { profilePicUrl: result.secure_url, tourist: updated };
}

/**
 * Compute and return dashboard stats for a tourist.
 */
export async function getStats(tourist) {
  const touristId = tourist._id;

  const [blogsPosted, upcomingBookings] = await Promise.all([
    Blog.countDocuments({ author: touristId, status: 'published' }),
    Booking.countDocuments({
      tourist: touristId,
      status: { $in: ['Confirmed', 'Pending'] },
      date: { $gte: new Date() },
    }),
  ]);

  return {
    workshopsAttended: tourist.workshopsAttended,
    blogsPosted,
    reviewsGiven: tourist.reviewsGiven,
    upcomingBookings,
  };
}

/**
 * Return saved workshops list.
 */
export function getSavedWorkshops(tourist) {
  return tourist.savedWorkshops;
}

/**
 * Add a workshop ID to the saved-workshops list.
 */
export async function addSavedWorkshop(touristId, workshopId) {
  const updated = await Tourist.findByIdAndUpdate(
    touristId,
    { $addToSet: { savedWorkshops: workshopId.toString() } },
    { new: true }
  );
  return updated.savedWorkshops;
}

/**
 * Remove a workshop ID from the saved-workshops list.
 */
export async function removeSavedWorkshop(touristId, workshopId) {
  const updated = await Tourist.findByIdAndUpdate(
    touristId,
    { $pull: { savedWorkshops: workshopId.toString() } },
    { new: true }
  );
  return updated.savedWorkshops;
}

/**
 * Return saved crafts list.
 */
export function getSavedCrafts(tourist) {
  return tourist.savedCrafts || [];
}

/**
 * Add a craft ID to the saved-crafts list.
 */
export async function addSavedCraft(touristId, craftId) {
  const updated = await Tourist.findByIdAndUpdate(
    touristId,
    { $addToSet: { savedCrafts: craftId.toString() } },
    { new: true }
  );
  return updated.savedCrafts;
}

/**
 * Remove a craft ID from the saved-crafts list.
 */
export async function removeSavedCraft(touristId, craftId) {
  const updated = await Tourist.findByIdAndUpdate(
    touristId,
    { $pull: { savedCrafts: craftId.toString() } },
    { new: true }
  );
  return updated.savedCrafts;
}

/**
 * Return the tourist's reviews array.
 */
export function getReviews(tourist) {
  return tourist.reviews || [];
}

/**
 * Replace the reviews array and keep reviewsGiven count in sync.
 */
export async function updateReviews(touristId, reviewIds) {
  const updated = await Tourist.findByIdAndUpdate(
    touristId,
    { $set: { reviews: reviewIds, reviewsGiven: reviewIds.length } },
    { new: true }
  );
  return updated.reviews;
}
