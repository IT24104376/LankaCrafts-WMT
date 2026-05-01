import Tourist from '../models/Tourist.js';
import Booking from '../models/workshopBooking.js';

export async function getTourists(req, res, next) {
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
        { country: { $regex: search, $options: 'i' } },
      ];
    }

    const tourists = await Tourist.find(filter).sort({ createdAt: -1 });

    const data = await Promise.all(tourists.map(async (t) => {
      const bookingsCount = await Booking.countDocuments({ customerId: t._id.toString() });
      return {
        _id: t._id,
        name: t.fullName,
        email: t.email,
        phone: t.phone || '',
        country: t.country || '',
        joinedDate: t.createdAt,
        status: t.status || 'active',
        initials: t.initials || (t.fullName || 'T').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
        reviews: t.reviewsGiven || 0,
        totalBookings: bookingsCount,
        lastActive: t.updatedAt || t.createdAt,
      };
    }));

    res.json({ success: true, data, count: data.length });
  } catch (err) {
    next(err);
  }
}

export async function toggleTouristStatus(req, res, next) {
  try {
    const tourist = await Tourist.findById(req.params.id);
    if (!tourist) return res.status(404).json({ success: false, message: 'Tourist not found.' });

    tourist.status = tourist.status === 'suspended' ? 'active' : 'suspended';
    await tourist.save();

    res.json({ success: true, data: tourist });
  } catch (err) {
    next(err);
  }
}
