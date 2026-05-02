import express from 'express';
import { protectArtist } from '../middleware/auth.js';
import {
  getArtistProfile,
  updateArtistProfile,
  getArtistBookings,
  getArtistSchedule,
  updateArtistSchedule
} from '../controllers/artistController.js';

const router = express.Router();

// Profile routes - protected (artist only)
router.get('/profile', protectArtist, getArtistProfile);
router.patch('/profile', protectArtist, updateArtistProfile);

// Bookings routes - protected (artist only)
router.get('/bookings', protectArtist, getArtistBookings);

// Schedule routes - protected (artist only)
router.get('/schedule', protectArtist, getArtistSchedule);
router.patch('/schedule', protectArtist, updateArtistSchedule);

export default router;