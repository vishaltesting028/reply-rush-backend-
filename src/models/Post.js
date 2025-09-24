const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Post title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Post content is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['post', 'reel'],
    default: 'post'
  },
  platform: {
    type: String,
    enum: ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok'],
    required: [true, 'Platform is required']
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'published', 'failed'],
    default: 'draft'
  },
  scheduledAt: {
    type: Date,
    default: null
  },
  publishedAt: {
    type: Date,
    default: null
  },
  mediaUrls: [{
    type: String,
    trim: true
  }],
  hashtags: [{
    type: String,
    trim: true
  }],
  isLinked: {
    type: Boolean,
    default: false
  },
  linkedAccounts: [{
    platform: String,
    accountId: String,
    accountName: String
  }],
  engagement: {
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    sent: { type: Number, default: 0 },
    open: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    pendingDM: { type: Number, default: 0 }
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for better query performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ status: 1 });
postSchema.index({ platform: 1 });
postSchema.index({ isLinked: 1 });

module.exports = mongoose.model('Post', postSchema);
