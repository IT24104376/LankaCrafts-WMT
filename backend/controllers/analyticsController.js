import Artist from '../models/Artist.js';
import Tourist from '../models/Tourist.js';
import Booking from '../models/workshopBooking.js';

export async function getOverview(req, res, next) {
  try {
    const [totalArtisans, totalTourists, activeArtists, pendingArtists] = await Promise.all([
      Artist.countDocuments(),
      Tourist.countDocuments(),
      Artist.countDocuments({ status: 'active' }),
      Artist.countDocuments({ status: 'pending' }),
    ]);
    res.json({
      success: true,
      data: {
        totalArtisans,
        totalTourists,
        activeWorkshops: activeArtists,
        pendingVerifications: pendingArtists,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getActivityChart(req, res, next) {
  try {
    const bookings = await Booking.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 7 }
    ]);
    const data = bookings.map(b => ({ label: b._id, users: 0, bookings: b.bookings })).reverse();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getTopArtisans(req, res, next) {
  try {
    const artisans = await Artist.find({ status: 'active' })
      .sort({ rating: -1, workshopsConducted: -1 })
      .limit(6);
    res.json({ success: true, data: artisans });
  } catch (err) {
    next(err);
  }
}

export async function getTouristDemographics(req, res, next) {
  try {
    const pipeline = [
      { $group: { _id: '$country', tourists: { $sum: 1 } } },
      { $sort: { tourists: -1 } },
      { $limit: 6 },
    ];
    const raw = await Tourist.aggregate(pipeline);
    const data = raw.map((d) => ({
      country: d._id || 'Unknown',
      count: d.tourists,
      bookings: 0,
    }));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getWorkshopPopularity(req, res, next) {
  try {
    const pipeline = [
      { $group: { _id: { name: '$craftName', craft: '$craftId' }, bookings: { $sum: 1 } } },
      { $sort: { bookings: -1 } },
      { $limit: 7 }
    ];
    const raw = await Booking.aggregate(pipeline);
    const data = raw.map((b) => ({
      name: b._id.name || 'Unknown',
      craft: b._id.craft || 'Unknown',
      bookings: b.bookings
    }));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
