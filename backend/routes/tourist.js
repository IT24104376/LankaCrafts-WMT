import express from 'express';
import multer from 'multer';
import { protectTourist } from '../middleware/auth.js';
import {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  getStats,
  getSavedWorkshops,
  addSavedWorkshop,
  removeSavedWorkshop,
  getReviews,
  updateReviews,
} from '../services/touristService.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const jsonLarge = express.json({ limit: '5mb' });

/**
 * GET /api/tourist/profile
 * Returns the authenticated tourist's full profile.
 */
router.get('/profile', protectTourist, async (req, res) => {
  const tourist = await getProfile(req.tourist._id);
  res.json({ tourist });
});

/**
 * PATCH /api/tourist/profile
 * Update allowed fields of the tourist profile.
 */
router.patch('/profile', protectTourist, jsonLarge, async (req, res) => {
  try {
    const updated = await updateProfile(req.tourist._id, req.body);
    res.json({ message: 'Profile updated.', tourist: updated });
  } catch (error) {
    res.status(500).json({ error: 'Update failed' });
  }
});

/**
 * POST /api/tourist/profile-picture
 * Upload a profile picture to Cloudinary and update the tourist profile.
 */
router.post('/profile-picture', protectTourist, upload.single('profilePic'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }

  const { profilePicUrl, tourist } = await uploadProfilePicture(req.tourist, req.file.buffer);
  res.json({ message: 'Profile picture updated.', profilePicUrl, tourist });
});

/**
 * GET /api/tourist/stats
 * Returns dashboard stats: workshops attended, blogs posted,
 * reviews given, upcoming bookings count.
 */
router.get('/stats', protectTourist, async (req, res) => {
  const stats = await getStats(req.tourist);
  res.json({ stats });
});

/**
 * GET /api/tourist/saved-workshops
 */
router.get('/saved-workshops', protectTourist, async (req, res) => {
  const savedWorkshops = getSavedWorkshops(req.tourist);
  res.json({ savedWorkshops });
});

/**
 * POST /api/tourist/saved-workshops
 */
router.post('/saved-workshops', protectTourist, express.json(), async (req, res) => {
  const { workshopId } = req.body;
  if (!workshopId) return res.status(400).json({ error: 'workshopId is required' });

  const savedWorkshops = await addSavedWorkshop(req.tourist._id, workshopId);
  res.json({ savedWorkshops });
});

/**
 * DELETE /api/tourist/saved-workshops/:id
 */
router.delete('/saved-workshops/:id', protectTourist, async (req, res) => {
  const savedWorkshops = await removeSavedWorkshop(req.tourist._id, req.params.id);
  res.json({ savedWorkshops });
});

/**
 * GET /api/tourist/reviews
 */
router.get('/reviews', protectTourist, async (req, res) => {
  const reviews = getReviews(req.tourist);
  res.json({ reviews });
});

/**
 * POST /api/tourist/reviews
 * Update reviews array given a String array with review IDs
 */
router.post('/reviews', protectTourist, express.json(), async (req, res) => {
  const { reviewIds } = req.body;
  if (!Array.isArray(reviewIds)) {
    return res.status(400).json({ error: 'reviewIds must be an array of strings' });
  }

  const reviews = await updateReviews(req.tourist._id, reviewIds);
  res.json({ reviews });
});

export default router;


