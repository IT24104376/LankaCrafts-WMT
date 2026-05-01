import mongoose from 'mongoose';

const craftSchema = new mongoose.Schema(
  {
    artistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artist',
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: [true, 'Craft name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    currency: {
      type: String,
      default: 'LKR',
    },

    category: {
      type: String,
      required: [true, 'Category is required'],
    },

    images: {
      type: [String],
      default: [],
    },

    stock: {
      type: Number,
      default: 1,
      min: 0,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    dimensions: {
      height: { type: Number },
      width: { type: Number },
      depth: { type: Number },
      unit: { type: String, default: 'cm' },
    },

    weight: {
      value: { type: Number },
      unit: { type: String, default: 'kg' },
    },

    materials: {
      type: [String],
      default: [],
    },

    tags: {
      type: [String],
      default: [],
    },

    views: {
      type: Number,
      default: 0,
    },
    salesCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

craftSchema.index({ category: 1 });
craftSchema.index({ price: 1 });
craftSchema.index({ artistId: 1, isAvailable: 1 });

export default mongoose.model('Craft', craftSchema);
