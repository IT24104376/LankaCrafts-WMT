import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'senderModel',
      required: true,
      index: true,
    },
    senderModel: {
      type: String,
      required: true,
      enum: ['Artist', 'Tourist', 'Admin']
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'recipientModel',
      required: true,
      index: true,
    },
    recipientModel: {
      type: String,
      required: true,
      enum: ['Artist', 'Tourist', 'Admin']
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000,
    },
    editedAt: {
      type: Date,
      default: null,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
