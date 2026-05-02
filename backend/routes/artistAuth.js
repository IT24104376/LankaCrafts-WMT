import express from 'express';
import { registerArtist, loginArtist } from '../services/authService.js';
import { signToken } from '../utils/tokenHelper.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const artist = await registerArtist(req.body);
    const token = signToken(artist._id, 'artist');

    res.status(201).json({
      success: true,
      message: 'Artist profile created successfully.',
      token,
      artist: {
        id: artist._id,
        fullName: artist.fullName,
        callingName: artist.callingName,
        email: artist.email,
        craftType: artist.craftType,
        bio: artist.bio,
        address: artist.address,
        availability: artist.availability,
        initials: artist.initials,
        profilePicUrl: artist.profilePicUrl,
        rating: artist.rating,
        reviewCount: artist.reviewCount,
        workshopsConducted: artist.workshopsConducted,
        status: artist.status,
      },
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const artist = await loginArtist(email, password);
    const token = signToken(artist._id, 'artist');

    res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      artist: {
        id: artist._id,
        fullName: artist.fullName,
        callingName: artist.callingName,
        email: artist.email,
        craftType: artist.craftType,
        bio: artist.bio,
        address: artist.address,
        availability: artist.availability,
        initials: artist.initials,
        profilePicUrl: artist.profilePicUrl,
        rating: artist.rating,
        reviewCount: artist.reviewCount,
        workshopsConducted: artist.workshopsConducted,
        status: artist.status,
      },
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message });
  }
});

export default router;
