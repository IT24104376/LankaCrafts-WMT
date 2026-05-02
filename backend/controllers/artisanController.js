import Artist from '../models/Artist.js';
import ActivityLog from '../models/ActivityLog.js';
import Booking from '../models/workshopBooking.js';

/**
 * Get all artisans (artists) - Admin
 */
export async function getArtisans(req, res, next) {
  try {
    const { status, search } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { craftType: { $regex: search, $options: 'i' } },
      ];
    }

    const artisans = await Artist.find(filter).sort({ createdAt: -1 });

    const data = await Promise.all(artisans.map(async (a) => {
      const bookingsCount = await Booking.countDocuments({ artisanId: a._id.toString() });
      return {
        _id: a._id,
        name: a.fullName,
        email: a.email,
        phone: a.phone || '',
        craft: a.craftType,
        location: `${a.address.city}, ${a.address.district}`,
        joinedDate: a.createdAt,
        status: a.status || 'active',
        initials: a.initials || (a.fullName || 'A').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
        totalBookings: bookingsCount,
        avgRating: a.rating || 0,
        workshopsConducted: a.workshopsConducted || 0,
      };
    }));

    res.json({ success: true, data, count: data.length });
  } catch (err) {
    next(err);
  }
}

/**
 * Get single artisan by ID - Admin
 */
export async function getArtisan(req, res, next) {
  try {
    const artisan = await Artist.findById(req.params.id);
    if (!artisan) {
      return res.status(404).json({ success: false, message: 'Artisan not found.' });
    }
    res.json({ success: true, data: artisan });
  } catch (err) {
    next(err);
  }
}

/**
 * Update artisan status - Admin
 */
export async function updateArtisanStatus(req, res, next) {
  try {
    const { status } = req.body;

    if (!['active', 'deactivated', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const artisan = await Artist.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!artisan) {
      return res.status(404).json({ success: false, message: 'Artisan not found.' });
    }

    await ActivityLog.create({
      type: status === 'active' ? 'verify' : 'reject',
      user: artisan.fullName || 'Unknown',
      description: `Artisan ${status}: ${artisan.fullName}`,
      page: '/admin/artisan-management',
    });

    res.json({ success: true, data: artisan });
  } catch (err) {
    next(err);
  }
}
