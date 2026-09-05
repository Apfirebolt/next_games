import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true, 
    trim: true 
  },
  slug: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    index: true 
  },
  description: { 
    type: String, 
    default: '' 
  },
  order: { 
    type: Number, 
    default: 0 
  }, // To control display sequence
  
  threadCount: { 
    type: Number, 
    default: 0 
  },
  postCount: { 
    type: Number, 
    default: 0 
  },

  // latest post
  lastActivity: {
    threadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Thread' },
    threadTitle: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String,
    updatedAt: Date
  }
}, { timestamps: true });

export const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);
export default Category;