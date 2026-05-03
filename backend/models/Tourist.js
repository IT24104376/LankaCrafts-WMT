import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const touristSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
    },

    // ── Step 1: Account Setup ──────────────────────────────────────────
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    callingName: {
      type: String,
      required: [true, 'Calling name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    preferredLanguages: {
      type: [String],
      default: [],
    },

    // ── Step 2: Personal Information ───────────────────────────────────
    idNumber: {
      type: String,
      default: '',
    },
    dateOfBirth: {
      type: Date,
    },
    address: {
      line1: { type: String, default: '' },
      line2: { type: String, default: '' },
      city: { type: String, default: '' },
      postalCode: { type: String, default: '' },
    },

    // ── Step 3: Interests ──────────────────────────────────────────────
    interests: {
      type: [String], // e.g. ['batik', 'pottery', 'woodcarving']
      default: [],
    },
    preferredRegions: {
      type: [String], // e.g. ['kandy', 'galle']
      default: [],
    },

    // ── Dashboard Stats ────────────────────────────────────────────────
    workshopsAttended: { type: Number, default: 0 },
    reviewsGiven: { type: Number, default: 0 },

    // ── Reviews ────────────────────────────────────────────────────────
    reviews: {
      type: [String],
      default: [],
    },

    // ── Saved Workshops ────────────────────────────────────────────────
    savedWorkshops: {
      type: [String], // store workshop IDs or names
      default: [],
    },

    // ── Saved Crafts ──────────────────────────────────────────────────────
    savedCrafts: {
      type: [String], // store craft IDs
      default: [],
    },

    // --- Profile Picture ---------------------------------------------
    profilePicUrl: {
      type: String,
      default: '',
    },

    // ── Status ─────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['active', 'suspended', 'deactivated'],
      default: 'active',
    },

    // ── Computed fields (on-the-fly via virtuals / route logic) ────────
    // blogsPosted    → count of Blog docs by this tourist
    // upcomingBookings → count of Booking docs with future date
  },
  { timestamps: true }
);

// Virtual: initials for the navbar avatar
touristSchema.virtual('initials').get(function () {
  if (!this.fullName) return 'LC';
  const parts = this.fullName.trim().split(' ');
  return parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : parts[0][0].toUpperCase();
});

touristSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

touristSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

touristSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Tourist', touristSchema);
