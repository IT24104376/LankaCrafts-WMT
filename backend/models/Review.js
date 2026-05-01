import mongoose from 'mongoose';

const photoSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    alt: { type: String, default: 'Review photo' }
  },
  { _id: false }
);

const artisanReplySchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    date: { type: Date, default: Date.now }
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    authorEmail: { type: String, required: true, lowercase: true, trim: true },
    touristName: { type: String, required: true, trim: true },
    touristInitials: { type: String, required: true, trim: true },
    touristColor: { type: String, default: '#2F5D50' },
    country: { type: String, default: 'Unknown' },
    countryFlag: { type: String, default: '🌍' },
    artisanName: { type: String, required: true, trim: true },
    workshopName: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, required: true, maxlength: 500 },
    photos: { type: [photoSchema], default: [] },
    status: {
      type: String,
      enum: ['active', 'hidden', 'flagged', 'removed'],
      default: 'active'
    },
    flagReason: { type: String, default: '' },
    reportCount: { type: Number, default: 0 },
    helpful: { type: Number, default: 0 },
    edited: { type: Boolean, default: false },
    isOwn: { type: Boolean, default: false },
    artisanReply: { type: artisanReplySchema, default: null }
  },
  { timestamps: true }
);

export const Review = mongoose.model('Review', reviewSchema);
