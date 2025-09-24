const UpcomingPost = require('../models/UpcomingPost');

// @desc    Get all upcoming posts for a user
// @route   GET /api/upcoming-posts
// @access  Private
const getUpcomingPosts = async (req, res) => {
  try {
    const { status, platform, page = 1, limit = 10 } = req.query;
    
    // Build filter object
    const filter = { author: req.user.id };
    
    if (status) filter.status = status;
    if (platform) filter.platform = platform;

    // Calculate pagination
    const skip = (page - 1) * limit;

    const upcomingPosts = await UpcomingPost.find(filter)
      .sort({ scheduledAt: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'name email');

    const total = await UpcomingPost.countDocuments(filter);

    res.json({
      success: true,
      data: upcomingPosts,
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

// @desc    Get single upcoming post
// @route   GET /api/upcoming-posts/:id
// @access  Private
const getUpcomingPost = async (req, res) => {
  try {
    const upcomingPost = await UpcomingPost.findOne({
      _id: req.params.id,
      author: req.user.id
    }).populate('author', 'name email');

    if (!upcomingPost) {
      return res.status(404).json({
        success: false,
        message: 'Upcoming post not found'
      });
    }

    res.json({
      success: true,
      data: upcomingPost
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new upcoming post
// @route   POST /api/upcoming-posts
// @access  Private
const createUpcomingPost = async (req, res) => {
  try {
    const upcomingPostData = {
      ...req.body,
      author: req.user.id
    };

    const upcomingPost = await UpcomingPost.create(upcomingPostData);
    
    await upcomingPost.populate('author', 'name email');

    res.status(201).json({
      success: true,
      data: upcomingPost
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update upcoming post
// @route   PUT /api/upcoming-posts/:id
// @access  Private
const updateUpcomingPost = async (req, res) => {
  try {
    const upcomingPost = await UpcomingPost.findOneAndUpdate(
      { _id: req.params.id, author: req.user.id },
      req.body,
      { new: true, runValidators: true }
    ).populate('author', 'name email');

    if (!upcomingPost) {
      return res.status(404).json({
        success: false,
        message: 'Upcoming post not found'
      });
    }

    res.json({
      success: true,
      data: upcomingPost
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete upcoming post
// @route   DELETE /api/upcoming-posts/:id
// @access  Private
const deleteUpcomingPost = async (req, res) => {
  try {
    const upcomingPost = await UpcomingPost.findOne({
      _id: req.params.id,
      author: req.user.id
    });

    if (!upcomingPost) {
      return res.status(404).json({
        success: false,
        message: 'Upcoming post not found'
      });
    }

    await upcomingPost.deleteOne();

    res.json({
      success: true,
      message: 'Upcoming post deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Save upcoming post configuration
// @route   POST /api/upcoming-posts/save-config
// @access  Private
const saveUpcomingPostConfig = async (req, res) => {
  try {
    const {
      title = 'Instagram Post Preview',
      content = 'The most beautiful and comfortable dress you can find',
      platform = 'instagram',
      scheduledAt,
      previewData = {
        profileImage: '/default-avatar.jpg',
        username: 'jenny_jk',
        likes: 0,
        comments: 0
      }
    } = req.body;

    const upcomingPostData = {
      title,
      content,
      platform,
      scheduledAt: scheduledAt || new Date(Date.now() + 24 * 60 * 60 * 1000), // Default to 24 hours from now
      previewData,
      author: req.user.id,
      status: 'scheduled'
    };

    const upcomingPost = await UpcomingPost.create(upcomingPostData);
    
    await upcomingPost.populate('author', 'name email');

    res.status(201).json({
      success: true,
      message: 'Upcoming post configuration saved successfully',
      data: upcomingPost
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Cancel upcoming post
// @route   PUT /api/upcoming-posts/:id/cancel
// @access  Private
const cancelUpcomingPost = async (req, res) => {
  try {
    const upcomingPost = await UpcomingPost.findOneAndUpdate(
      { _id: req.params.id, author: req.user.id },
      { status: 'cancelled' },
      { new: true, runValidators: true }
    ).populate('author', 'name email');

    if (!upcomingPost) {
      return res.status(404).json({
        success: false,
        message: 'Upcoming post not found'
      });
    }

    res.json({
      success: true,
      message: 'Upcoming post cancelled successfully',
      data: upcomingPost
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get upcoming posts statistics
// @route   GET /api/upcoming-posts/stats
// @access  Private
const getUpcomingPostsStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await UpcomingPost.aggregate([
      { $match: { author: userId } },
      {
        $group: {
          _id: null,
          totalUpcoming: { $sum: 1 },
          scheduledPosts: {
            $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] }
          },
          draftPosts: {
            $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
          },
          cancelledPosts: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalUpcoming: 0,
      scheduledPosts: 0,
      draftPosts: 0,
      cancelledPosts: 0
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

module.exports = {
  getUpcomingPosts,
  getUpcomingPost,
  createUpcomingPost,
  updateUpcomingPost,
  deleteUpcomingPost,
  saveUpcomingPostConfig,
  cancelUpcomingPost,
  getUpcomingPostsStats,
};
