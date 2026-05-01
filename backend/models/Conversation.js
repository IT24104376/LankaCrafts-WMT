import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    artistUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artist',
      required: true,
      index: true,
    },
    touristUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tourist',
      required: true,
      index: true,
    },
    artistProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artist',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tourist',
      required: true,
    },
    lastMessage: {
      text: { type: String, default: '' },
      senderId: { type: mongoose.Schema.Types.ObjectId, refPath: 'lastMessage.senderModel', default: null },
      senderModel: { type: String, enum: ['Artist', 'Tourist', 'Admin'], default: 'Tourist' },
      createdAt: { type: Date, default: null },
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({ artistUserId: 1, touristUserId: 1 }, { unique: true });

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
