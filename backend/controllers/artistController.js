import Artist from '../models/Artist.js';
import Booking from '../models/workshopBooking.js';

/**
 * Get artist's own profile
 */
export async function getArtistProfile(req, res, next) {
  try {
    const artist = await Artist.findById(req.artist._id);
    if (!artist) {
      return res.status(404).json({ success: false, message: 'Artist profile not found.' });
    }
    res.json({ success: true, data: artist });
  } catch (err) {
    next(err);
  }
}

/**
 * Update artist's own profile
 */
export async function updateArtistProfile(req, res, next) {
  try {
    const allowedFields = [
      'fullName',
      'callingName',
      'email',
      'phone',
      'craftType',
      'bio',
      'profilePicUrl',
      'address',
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const artist = await Artist.findByIdAndUpdate(
      req.artist._id,
      updates,
      { new: true, runValidators: true }
    );

    if (!artist) {
      return res.status(404).json({ success: false, message: 'Artist profile not found.' });
    }

    res.json({ success: true, data: artist });
  } catch (err) {
    next(err);
  }
}

/**
 * Get bookings for the authenticated artist
 */
export async function getArtistBookings(req, res, next) {
  try {
    const artist = await Artist.findById(req.artist._id);
    if (!artist) {
      return res.status(404).json({ success: false, message: 'Artist profile not found.' });
    }

    const filter = { artisanId: artist._id.toString() };

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const bookings = await Booking.find(filter).sort({ createdAt: -1 });

    res.json({ success: true, data: bookings, count: bookings.length });
  } catch (err) {
    next(err);
  }
}

/**
 * Get artist's schedule (availability)
 */
export async function getArtistSchedule(req, res, next) {
  try {
    const artist = await Artist.findById(req.artist._id).select('availability');
    if (!artist) {
      return res.status(404).json({ success: false, message: 'Artist profile not found.' });
    }
    res.json({ success: true, data: artist.availability || {} });
  } catch (err) {
    next(err);
  }
}

/**
 * Update artist's schedule (availability)
 */
export async function updateArtistSchedule(req, res, next) {
  try {
    const { availability } = req.body;

    if (!availability || typeof availability !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid availability data.' });
    }

    const artist = await Artist.findByIdAndUpdate(
      req.artist._id,
      { availability },
      { new: true, runValidators: true }
    );

    if (!artist) {
      return res.status(404).json({ success: false, message: 'Artist profile not found.' });
    }

    res.json({ success: true, data: artist.availability });
  } catch (err) {
    next(err);
  }
}
