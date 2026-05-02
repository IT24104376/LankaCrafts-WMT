import express from 'express';
import { registerTourist, loginTourist } from '../services/authService.js';
import { signToken } from '../utils/tokenHelper.js';

const router = express.Router();

/**
 * POST /api/tourist/register
 * Expects email, password, and profile fields in the body.
 */
router.post('/register', async (req, res) => {
  try {
    const tourist = await registerTourist(req.body);
    const token = signToken(tourist._id, 'tourist');

    res.status(201).json({
      success: true,
      message: 'Tourist profile created successfully.',
      token,
      tourist: {
        id: tourist._id,
        fullName: tourist.fullName,
        callingName: tourist.callingName,
        email: tourist.email,
        interests: tourist.interests,
        preferredLanguages: tourist.preferredLanguages,
        preferredRegions: tourist.preferredRegions,
        idNumber: tourist.idNumber,
        dateOfBirth: tourist.dateOfBirth,
        address: tourist.address,
        savedWorkshops: tourist.savedWorkshops,
        savedCrafts: tourist.savedCrafts,
        initials: tourist.initials,
        profilePicUrl: tourist.profilePicUrl,
        reviews: tourist.reviews
      },
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/tourist/login
 * Expects email and password in the body.
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const tourist = await loginTourist(email, password);
    const token = signToken(tourist._id, 'tourist');

    res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      tourist: {
        id: tourist._id,
        fullName: tourist.fullName,
        callingName: tourist.callingName,
        email: tourist.email,
        country: tourist.country,
        interests: tourist.interests,
        preferredLanguages: tourist.preferredLanguages,
        preferredRegions: tourist.preferredRegions,
        idNumber: tourist.idNumber,
        dateOfBirth: tourist.dateOfBirth,
        address: tourist.address,
        savedWorkshops: tourist.savedWorkshops,
        savedCrafts: tourist.savedCrafts,
        initials: tourist.initials,
        profilePicUrl: tourist.profilePicUrl,
        reviews: tourist.reviews
      },
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

export default router;

