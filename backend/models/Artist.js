import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const artistSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      unique: true,
      index: true,
      sparse: true,
    },

    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    callingName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    phone: {
      type: String,
      default: '',
    },

    craftType: {
      type: String,
      enum: ['Pottery','Wood Carving','Handloom','Batik','Jewelry','Mask Making','Lacquer Work','Cane & Bamboo','Ceramics','Painting','Sculpture','Embroidery','Leather Craft','Paper Craft','Other'],
      required: [true, 'Craft type is required'],
    },
    bio: {
      type: String,
      default: '',
    },
    profilePicUrl: {
      type: String,
      default: '',
    },

    address: {
      number: { type: String, default: '' },
      street: { type: String, default: '' },
      village: { type: String, default: '' },
      city: { 
        type: String, 
        required: [true, 'City is required'] 
      },
      district: { 
        type: String, 
        enum: ['Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya', 'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee', 'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla', 'Moneragala', 'Ratnapura', 'Kegalle'],
        required: [true, 'District is required'] 
      },
      province: { 
        type: String, 
        enum: ['Western', 'Central', 'Southern', 'Northern', 'Eastern', 'North Western', 'North Central', 'Uva', 'Sabaragamuwa'],
        required: [true, 'Province is required'] 
      },
      postalCode: { type: String, default: '' },
    },

    availability: {
      type: Map,
      of: {
        morning: { type: Boolean, default: false },
        afternoon: { type: Boolean, default: false },
        evening: { type: Boolean, default: false },
      },
      default: {},
    },

    rating: {
      type: Number,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },

    workshopsConducted: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ['active', 'deactivated', 'pending'],
      default: 'active',
    },
  },
  { timestamps: true }
);

artistSchema.virtual('initials').get(function () {
  if (!this.fullName) return 'LC';
  const parts = this.fullName.trim().split(' ');
  return parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : parts[0][0].toUpperCase();
});

artistSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

artistSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

artistSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Artist', artistSchema);
