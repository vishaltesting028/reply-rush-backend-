const Story = require('../models/Story');

// @desc    Get all stories for a user
// @route   GET /api/stories
// @access  Private
const getStories = async (req, res) => {
  try {
    const { status, platform, isLinked, page = 1, limit = 10 } = req.query;
    
    // Build filter object
    const filter = { author: req.user.id };
    
    if (status) filter.status = status;
    if (platform) filter.platform = platform;
    if (isLinked !== undefined) filter.isLinked = isLinked === 'true';

    // Calculate pagination
    const skip = (page - 1) * limit;

    const stories = await Story.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'name email');

    const total = await Story.countDocuments(filter);

    res.json({
      success: true,
      data: stories,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single story
// @route   GET /api/stories/:id
// @access  Private
const getStory = async (req, res) => {
  try {
    const story = await Story.findOne({
      _id: req.params.id,
      author: req.user.id
    }).populate('author', 'name email');

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    res.json({
      success: true,
      data: story
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new story
// @route   POST /api/stories
// @access  Private
const createStory = async (req, res) => {
  try {
    const storyData = {
      ...req.body,
      author: req.user.id
    };

    const story = await Story.create(storyData);
    
    await story.populate('author', 'name email');

    res.status(201).json({
      success: true,
      data: story
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update story
// @route   PUT /api/stories/:id
// @access  Private
const updateStory = async (req, res) => {
  try {
    const story = await Story.findOneAndUpdate(
      { _id: req.params.id, author: req.user.id },
      req.body,
      { new: true, runValidators: true }
    ).populate('author', 'name email');

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    res.json({
      success: true,
      data: story
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete story
// @route   DELETE /api/stories/:id
// @access  Private
const deleteStory = async (req, res) => {
  try {
    const story = await Story.findOne({
      _id: req.params.id,
      author: req.user.id
    });

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    await story.deleteOne();

    res.json({
      success: true,
      message: 'Story deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Fetch latest stories from social media platforms
// @route   POST /api/stories/fetch-latest
// @access  Private
const fetchLatestStories = async (req, res) => {
  try {
    // This would typically integrate with social media APIs
    // For now, we'll return a mock response
    
    const mockStories = [
      {
        title: 'Sample Instagram Story',
        content: 'Check out our latest product!',
        mediaUrl: '/uploads/sample-story-1.jpg',
        mediaType: 'image',
        platform: 'instagram',
        status: 'published',
        publishedAt: new Date(),
        isLinked: true,
        linkedAccounts: [{
          platform: 'instagram',
          accountId: 'sample_account',
          accountName: '@sample_user'
        }],
        engagement: {
          views: 500,
          likes: 45,
          replies: 8,
          shares: 12
        },
        author: req.user.id
      },
      {
        title: 'Sample Facebook Story',
        content: 'Behind the scenes video',
        mediaUrl: '/uploads/sample-story-2.mp4',
        mediaType: 'video',
        platform: 'facebook',
        status: 'published',
        publishedAt: new Date(),
        duration: 15,
        isLinked: true,
        linkedAccounts: [{
          platform: 'facebook',
          accountId: 'sample_fb_account',
          accountName: 'Sample Facebook Page'
        }],
        engagement: {
          views: 320,
          likes: 28,
          replies: 5,
          shares: 7
        },
        author: req.user.id
      }
    ];

    // In a real implementation, you would:
    // 1. Check user's connected social media accounts
    // 2. Use platform APIs to fetch recent stories
    // 3. Save new stories to database
    // 4. Return the fetched stories

    // For demo purposes, create sample stories
    const createdStories = await Story.insertMany(mockStories);

    res.json({
      success: true,
      message: 'Latest stories fetched successfully',
      data: createdStories,
      count: createdStories.length
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get stories statistics
// @route   GET /api/stories/stats
// @access  Private
const getStoriesStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await Story.aggregate([
      { $match: { author: userId } },
      {
        $group: {
          _id: null,
          totalStories: { $sum: 1 },
          linkedStories: {
            $sum: { $cond: [{ $eq: ['$isLinked', true] }, 1, 0] }
          },
          unlinkedStories: {
            $sum: { $cond: [{ $eq: ['$isLinked', false] }, 1, 0] }
          },
          totalViews: { $sum: '$engagement.views' },
          totalLikes: { $sum: '$engagement.likes' },
          totalReplies: { $sum: '$engagement.replies' },
          totalShares: { $sum: '$engagement.shares' }
        }
      }
    ]);

    const result = stats[0] || {
      totalStories: 0,
      linkedStories: 0,
      unlinkedStories: 0,
      totalViews: 0,
      totalLikes: 0,
      totalReplies: 0,
      totalShares: 0
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Clean up expired stories
// @route   DELETE /api/stories/cleanup-expired
// @access  Private
const cleanupExpiredStories = async (req, res) => {
  try {
    const result = await Story.deleteMany({
      author: req.user.id,
      expiresAt: { $lt: new Date() }
    });

    res.json({
      success: true,
      message: `${result.deletedCount} expired stories cleaned up`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getStories,
  getStory,
  createStory,
  updateStory,
  deleteStory,
  fetchLatestStories,
  getStoriesStats,
  cleanupExpiredStories,
};
