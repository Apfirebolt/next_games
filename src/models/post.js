import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema({
  threadId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Thread', 
    required: true, 
    index: true 
  },
  author: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    avatarUrl: { type: String, default: '' }
  },
  content: { 
    type: String, 
    required: true 
  },

  // Cloudinary image upload (optional)
  media: {
    url: { type: String, default: null },
    publicId: { type: String, default: null } // Required to delete/replace from Cloudinary API
  },

  // Quoting functionality (selection-based quoting)
  quote: {
    originalPostId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null },
    authorName: { type: String, default: null },
    selectedText: { type: String, default: null }
  },

  // Nested Tree Hierarchy (Materialized Path Pattern)
  parentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Post', 
    default: null,
    index: true 
  },
  // Example path: ",660e1... ," for top-level, ",660e1...,660e2...," for nested replies
  path: { 
    type: String, 
    default: '', 
    index: true 
  },
  depth: { 
    type: Number, 
    default: 0 
  }, // Useful for styling indentations in CSS (e.g., depth * 16px)

  likesCount: { 
    type: Number, 
    default: 0 
  }
}, { timestamps: true });

// Pre-save hook to populate materialized path automatically
PostSchema.pre('save', async function () {
  if (this.isNew && this.parentId) {
    const PostModel = mongoose.models.Post || mongoose.model('Post');
    const parent = await PostModel.findById(this.parentId).select('path depth');
    if (parent) {
      this.path = `${parent.path}${parent._id},`;
      this.depth = (parent.depth || 0) + 1;
    }
  } else if (this.isNew && !this.parentId) {
    this.path = ',';
    this.depth = 0;
  }
});

// Index to retrieve thread posts in nested tree or chronological order
PostSchema.index({ threadId: 1, path: 1, createdAt: 1 });

export const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);
export default Post;