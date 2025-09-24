const mongoose = require('mongoose');

const upcomingPostSchema = new mongoose.Schema({
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
    enum: ['post', 'reel', 'story'],
    default: 'post'
  },
  platform: {
    type: String,
    enum: ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok'],
    required: [true, 'Platform is required']
  },
  scheduledAt: {
    type: Date,
    required: [true, 'Scheduled date is required']
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'published', 'failed', 'cancelled'],
    default: 'scheduled'
  },
  mediaUrls: [{
    type: String,
    trim: true
  }],
  hashtags: [{
    type: String,
    trim: true
  }],
  mentions: [{
    type: String,
    trim: true
  }],
  linkedAccounts: [{
    platform: String,
    accountId: String,
    accountName: String
  }],
  postSettings: {
    enableComments: { type: Boolean, default: true },
    enableLikes: { type: Boolean, default: true },
    enableSharing: { type: Boolean, default: true },
    audienceType: { 
      type: String, 
      enum: ['public', 'private', 'friends', 'custom'],
      default: 'public'
    }
  },
  previewData: {
    profileImage: String,
    username: String,
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 }
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  publishedAt: {
    type: Date,
    default: null
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
upcomingPostSchema.index({ author: 1, scheduledAt: 1 });
upcomingPostSchema.index({ status: 1 });
upcomingPostSchema.index({ platform: 1 });

// Virtual for checking if post is overdue
upcomingPostSchema.virtual('isOverdue').get(function() {
  return this.scheduledAt < new Date() && this.status === 'scheduled';
});

// Update lastModified on save
upcomingPostSchema.pre('save', function(next) {
  this.lastModified = new Date();
  next();
});

module.exports = mongoose.model('UpcomingPost', upcomingPostSchema);
