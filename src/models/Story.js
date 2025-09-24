const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Story title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  content: {
    type: String,
    required: [true, 'Story content is required'],
    trim: true
  },
  mediaUrl: {
    type: String,
    required: [true, 'Story media URL is required'],
    trim: true
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    required: [true, 'Media type is required']
  },
  platform: {
    type: String,
    enum: ['instagram', 'facebook', 'snapchat', 'whatsapp'],
    required: [true, 'Platform is required']
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'published', 'expired', 'failed'],
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
  expiresAt: {
    type: Date,
    default: function() {
      // Stories typically expire after 24 hours
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
  },
  duration: {
    type: Number, // Duration in seconds for video stories
    default: null
  },
  hashtags: [{
    type: String,
    trim: true
  }],
  mentions: [{
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
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    replies: { type: Number, default: 0 },
    shares: { type: Number, default: 0 }
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
storySchema.index({ author: 1, createdAt: -1 });
storySchema.index({ status: 1 });
storySchema.index({ platform: 1 });
storySchema.index({ isLinked: 1 });
storySchema.index({ expiresAt: 1 });

// Virtual for checking if story is expired
storySchema.virtual('isExpired').get(function() {
  return this.expiresAt < new Date();
});

module.exports = mongoose.model('Story', storySchema);
