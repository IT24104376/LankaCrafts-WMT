import express from 'express';
import multer from 'multer';
import Artist from '../models/Artist.js';
import { getArtistProfile, updateArtistProfile, deleteArtistProfile, uploadProfilePicture } from '../services/artistService.js';
import { protectArtist } from '../middleware/auth.js';
import { getCraftsByArtist, createCraft, updateCraft, deleteCraft } from '../services/craftService.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

router.get('/profile', protectArtist, async (req, res) => {
  try {
    const artist = await getArtistProfile(req.uid);
    res.json({ artist });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.patch('/profile', protectArtist, async (req, res) => {
  try {
    const artist = await updateArtistProfile(req.uid, req.body);
    res.json({ 
      message: 'Profile updated successfully.',
      artist: {
        id: artist._id,
        fullName: artist.fullName,
        callingName: artist.callingName,
        email: artist.email,
        phone: artist.phone,
        craftType: artist.craftType,
        bio: artist.bio,
        address: artist.address,
        location: artist.location,
        specialties: artist.specialties,
        availability: artist.availability,
        profilePicUrl: artist.profilePicUrl,
        rating: artist.rating,
        reviewCount: artist.reviewCount,
        initials: artist.initials,
      }
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.delete('/profile', protectArtist, async (req, res) => {
  try {
    await deleteArtistProfile(req.uid);
    res.json({ message: 'Profile deleted successfully.' });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/profile-picture', protectArtist, upload.single('profilePic'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }
    const artist = req.artist;
    const result = await uploadProfilePicture(artist, req.file.buffer);
    res.json({
      message: 'Profile picture updated successfully.',
      profilePicUrl: result.profilePicUrl,
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.get('/crafts', protectArtist, async (req, res) => {
  try {
    const crafts = await getCraftsByArtist(req.artist._id);
    res.json({ crafts });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/crafts', protectArtist, async (req, res) => {
  try {
    const craft = await createCraft(req.artist._id, req.body);
    res.status(201).json({
      message: 'Craft created successfully.',
      craft
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.patch('/crafts/:id', protectArtist, async (req, res) => {
  try {
    const craft = await updateCraft(req.params.id, req.artist._id, req.body);
    res.json({
      message: 'Craft updated successfully.',
      craft
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.delete('/crafts/:id', protectArtist, async (req, res) => {
  try {
    await deleteCraft(req.params.id, req.artist._id);
    res.json({ message: 'Craft deleted successfully.' });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

export default router;


