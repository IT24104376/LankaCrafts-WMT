import Booking from '../models/workshopBooking.js';

// --------------------
// CREATE BOOKING
// --------------------
export const createBooking = async (req, res) => {
  try {
    const {
      artisanId,
      craftId,
      craftName,
      artisanName,
      customerId,
      location,
      name,
      email,
      phone,
      date,
      time,
      groupSize
    } = req.body;

    const newBooking = new Booking({
      artisanId,
      craftId,
      craftName,
      artisanName,
      location,
      customerId,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      bookingDate: date,
      bookingTime: time,
      groupSize
    });

    const savedBooking = await newBooking.save();

    res.status(201).json({
      success: true,
      message: "Booking saved successfully!",
      data: savedBooking
    });

  } catch (err) {
    console.error("Save Error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to save booking"
    });
  }
};

// --------------------
// GET ALL BOOKINGS
// --------------------
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch bookings" });
  }
};

// --------------------
// GET BOOKINGS BY EMAIL
// --------------------
export const getBookingsByEmail = async (req, res) => {
  try {
    const bookings = await Booking.find({
      customerEmail: req.params.email
    }).sort({ bookingDate: 1 });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch user bookings" });
  }
};

// --------------------
// GET BOOKING BY ID
// --------------------
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch booking" });
  }
};

// --------------------
// UPDATE BOOKING
// --------------------
export const updateBooking = async (req, res) => {
  try {
    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedBooking);
  } catch (err) {
    res.status(500).json({ error: "Failed to update booking" });
  }
};

// --------------------
// DELETE BOOKING
// --------------------
export const deleteBooking = async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: "Booking deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete booking" });
  }
};