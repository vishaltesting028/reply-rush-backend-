const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  avatar: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    default: null
  },
  company: {
    type: String,
    default: null
  },
  website: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  facebook: {
    id: {
      type: String,
      default: null
    },
    name: {
      type: String,
      default: null
    },
    email: {
      type: String,
      default: null
    },
    picture: {
      type: String,
      default: null
    },
    link: {
      type: String,
      default: null
    },
    accessToken: {
      type: String,
      default: null
    },
    refreshToken: {
      type: String,
      default: null
    },
    connectedAt: {
      type: Date,
      default: null
    },
    lastLoginAt: {
      type: Date,
      default: null
    }
  },
  instagram: {
    username: {
      type: String,
      default: null
    },
    accessToken: {
      type: String,
      default: null
    },
    instagramUserId: {
      type: String,
      default: null
    },
    accountType: {
      type: String,
      default: null
    },
    mediaCount: {
      type: Number,
      default: 0
    },
    followersCount: {
      type: Number,
      default: 0
    },
    followingCount: {
      type: Number,
      default: 0
    },
    biography: {
      type: String,
      default: null
    },
    website: {
      type: String,
      default: null
    },
    profilePictureUrl: {
      type: String,
      default: null
    },
    isConnected: {
      type: Boolean,
      default: false
    },
    connectedAt: {
      type: Date,
      default: null
    },
    lastSyncAt: {
      type: Date,
      default: null
    },
    media: [{
      mediaId: String,
      mediaType: String,
      mediaUrl: String,
      thumbnailUrl: String,
      caption: String,
      timestamp: Date,
      permalink: String,
      engagement: {
        likes: { type: Number, default: 0 },
        comments: { type: Number, default: 0 },
        impressions: { type: Number, default: 0 },
        reach: { type: Number, default: 0 },
        engagement: { type: Number, default: 0 }
      },
      syncedAt: Date
    }],
    profile: {
      id: String,
      username: String,
      name: String,
      accountType: String,
      mediaCount: Number,
      followersCount: Number,
      followingCount: Number,
      biography: String,
      website: String,
      profilePictureUrl: String,
      lastUpdated: Date
    }
  }
}, {
  timestamps: true
});

// Encrypt password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
