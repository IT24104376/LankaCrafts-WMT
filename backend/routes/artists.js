import express from 'express';
import Artist from '../models/Artist.js';

const router = express.Router();

/**
 * @route   GET /api/artists/featured
 * @desc    Get the featured artist of the week
 * @access  Public
 */
router.get('/featured', async (req, res) => {
  try {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    let artist = await Artist.findOne({
      isFeatured: true,
      featuredWeekStart: { $gte: startOfWeek }
    }).select('-firebaseUid');

    if (!artist) {
      // Find the last featured artist and un-feature them
      const lastFeatured = await Artist.findOne({
        isFeatured: true,
        featuredWeekStart: { $lt: startOfWeek }
      }).sort({ featuredWeekStart: -1 });

      if (lastFeatured) {
        lastFeatured.isFeatured = false;
        await lastFeatured.save();
      }

      // Select a new featured artist randomly from active artists
      const availableArtists = await Artist.find({
        status: 'active',
        $or: [
          { isFeatured: false },
          { isFeatured: { $exists: false } }
        ]
      }).limit(20);

      if (availableArtists.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableArtists.length);
        artist = availableArtists[randomIndex];
        artist.isFeatured = true;
        artist.featuredWeekStart = startOfWeek;
        await artist.save();
      }
    }

    if (!artist) {
      return res.status(404).json({ error: 'No featured artist available.' });
    }

    res.json({ artist });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route   GET /api/artists/:id
 * @desc    Get artist by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const artist = await Artist.findById(id).select('-firebaseUid');

    if (!artist) {
      return res.status(404).json({ error: 'Artist not found.' });
    }

    res.json({ artist });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route   GET /api/artists
 * @desc    Get all active artists with pagination and search
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, craftType, search } = req.query;

    const query = { status: 'active' };

    if (craftType) {
      query.craftType = craftType;
    }

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
        { craftType: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [artists, total] = await Promise.all([
      Artist.find(query)
        .select('-firebaseUid')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      Artist.countDocuments(query)
    ]);

    res.json({
      artists,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
