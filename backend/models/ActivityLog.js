import { Schema, model } from 'mongoose';

const activityLogSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['login', 'logout', 'booking', 'search', 'view', 'register', 'review', 'verify', 'suspend', 'reject', 'listing'],
      required: true,
    },
    user: { type: String, required: true },
    initials: { type: String },
    color: { type: String, default: '#2F5D50' },
    description: { type: String, required: true },
    page: { type: String },
    country: { type: String },
  },
  { timestamps: true }
);

export default model('ActivityLog', activityLogSchema);
