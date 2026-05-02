import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  artisanId: { type: String, required: true },
  craftId: { type: String, required: true },
  craftName: { type: String, required: true },
  artisanName: { type: String, required: true },
  location: { type: String, required: true },
  customerId: { type: String, required: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String, required: true },
  bookingDate: { type: String, required: true },
  bookingTime: { type: String, required: true },
  groupSize: { type: Number, default: 1, min: 1 },
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('workshopBooking', bookingSchema);