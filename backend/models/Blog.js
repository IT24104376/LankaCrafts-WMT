import mongoose from 'mongoose';

// ── Sub-document: a single media attachment ────────────────────────────────
const mediaItemSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,   // Cloudinary public_id — used for deletion
      required: true,
    },
    mediaType: {
      type: String,
      enum: ['image', 'video'],
      required: true,
    },
    order: {
      type: Number,   // 0-based display order set by the service
      default: 0,
    },
  },
  { _id: true }       // keep sub-document _id so individual items can be removed by id
);

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Blog title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Blog content is required'],
    },
    workshopTag: {
      type: String,
      default: '',
    },

    hashtags: {
      type: [String],
      default: [],
    },

    // ── Multi-media array (new) ──────────────────────────────────────────
    media: {
      type: [mediaItemSchema],
      default: [],
      validate: {
        validator: function (val) {
          return val.length <= 10; // max 10 items
        },
        message: 'You can upload a maximum of 10 media files per blog.',
      },
    },


    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tourist',
      required: true,
    },
    // Array of Tourist ObjectIds who liked this post
    likes: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Tourist',
      default: [],
    },
    status: {
      type: String,
      enum: ['published', 'draft', 'deleted'],
      default: 'published',
    },
  },
  { timestamps: true }
);

// Virtual: total like count
blogSchema.virtual('likeCount').get(function () {
  return this.likes.length;
});

blogSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Blog', blogSchema);
