import Booking from '../models/workshopBooking.js';

/**
 * Middleware to check if either the artisan or the tourist is already booked
 * for the same date and time.
 */
export const checkDoubleBooking = async (req, res, next) => {
  try {
    const { artisanId, date, time, customerId } = req.body;

    if (!artisanId || !date || !time) {
      return next(); // Let validateBookingBody handle missing fields
    }

    // Use customerId from body or from authenticated tourist
    const finalCustomerId = customerId || (req.tourist ? req.tourist._id : null);

    // Check 1 — Is the artisan already booked at this date/time by anyone?
    const artisanQuery = {
      artisanId,
      bookingDate: date,
      bookingTime: time,
      status: { $in: ['pending', 'confirmed'] }
    };

    // Exclude current booking if updating
    if (req.params.id) {
      artisanQuery._id = { $ne: req.params.id };
    }

    const artisanBooked = await Booking.findOne(artisanQuery);
    if (artisanBooked) {
      return res.status(409).json({
        success: false,
        error: 'This artisan is already booked for this date and time.'
      });
    }

    // Check 2 — Does this tourist already have a booking at this date/time?
    if (finalCustomerId) {
      const touristQuery = {
        customerId: finalCustomerId,
        bookingDate: date,
        bookingTime: time,
        status: { $in: ['pending', 'confirmed'] }
      };

      if (req.params.id) {
        touristQuery._id = { $ne: req.params.id };
      }

      const touristBooked = await Booking.findOne(touristQuery);
      if (touristBooked) {
        return res.status(409).json({
          success: false,
          error: 'You already have a booking at this date and time.'
        });
      }
    }

    next();
  } catch (err) {
    console.error('Double Booking Check Error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to verify booking availability.'
    });
  }
};