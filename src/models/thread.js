import mongoose from 'mongoose';

const ThreadSchema = new mongoose.Schema({
  categoryId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category', 
    required: true, 
    index: true 
  },
  title: { 
    type: String, 
    required: true, 
    trim: true 
  },
  slug: { 
    type: String, 
    required: true, 
    lowercase: true,
    trim: true 
  },
  
  // Author
  creator: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    avatarUrl: { type: String, default: '' }
  },

  // Thread Cover / Header Image
  media: {
    url: { type: String, default: null },
    publicId: { type: String, default: null },
  },

  // Metadata flags
  isPinned: { type: Boolean, default: false },
  isLocked: { type: Boolean, default: false },
  viewsCount: { type: Number, default: 0 },
  replyCount: { type: Number, default: 0 },

  // latest reply
  latestPost: {
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String,
    avatarUrl: String,
    createdAt: Date
  }
}, { timestamps: true });

ThreadSchema.index({ categoryId: 1, 'latestPost.createdAt': -1 });
ThreadSchema.index({ categoryId: 1, isPinned: -1, 'latestPost.createdAt': -1 });

export const Thread = mongoose.models.Thread || mongoose.model('Thread', ThreadSchema);
export default Thread;