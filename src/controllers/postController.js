const Post = require('../models/Post');

// @desc    Get all posts for a user
// @route   GET /api/posts
// @access  Private
const getPosts = async (req, res) => {
  try {
    const { status, platform, isLinked, page = 1, limit = 10 } = req.query;
    
    // Build filter object
    const filter = { author: req.user.id };
    
    if (status) filter.status = status;
    if (platform) filter.platform = platform;
    if (isLinked !== undefined) filter.isLinked = isLinked === 'true';

    // Calculate pagination
    const skip = (page - 1) * limit;

    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'name email');

    const total = await Post.countDocuments(filter);

    res.json({
      success: true,
      data: posts,
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

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Private
const getPost = async (req, res) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
      author: req.user.id
    }).populate('author', 'name email');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new post
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res) => {
  try {
    const postData = {
      ...req.body,
      author: req.user.id
    };

    const post = await Post.create(postData);
    
    await post.populate('author', 'name email');

    res.status(201).json({
      success: true,
      data: post
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private
const updatePost = async (req, res) => {
  try {
    const post = await Post.findOneAndUpdate(
      { _id: req.params.id, author: req.user.id },
      req.body,
      { new: true, runValidators: true }
    ).populate('author', 'name email');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
const deletePost = async (req, res) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
      author: req.user.id
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    await post.deleteOne();

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Fetch latest posts from social media platforms
// @route   POST /api/posts/fetch-latest
// @access  Private
const fetchLatestPosts = async (req, res) => {
  try {
    // This would typically integrate with social media APIs
    // For now, we'll return a mock response
    
    const mockPosts = [
      {
        title: 'Sample Instagram Post',
        content: 'This is a sample post fetched from Instagram',
        type: 'post',
        platform: 'instagram',
        status: 'published',
        publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
        isLinked: true,
        mediaUrls: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=400&fit=crop',
        linkedAccounts: [{
          platform: 'instagram',
          accountId: 'sample_account',
          accountName: '@sample_user'
        }],
        engagement: {
          likes: 0,
          comments: 0,
          shares: 0,
          views: 0,
          sent: 0,
          open: 0,
          clicks: 0,
          pendingDM: 0
        },
        author: req.user.id
      },
      {
        title: 'Sample Facebook Post',
        content: 'This is a sample post fetched from Facebook',
        type: 'post',
        platform: 'facebook',
        status: 'published',
        publishedAt: new Date(Date.now() - 5.5 * 60 * 60 * 1000), // 5.5 hours ago
        isLinked: true,
        mediaUrls: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop',
        linkedAccounts: [{
          platform: 'facebook',
          accountId: 'sample_fb_account',
          accountName: 'Sample Facebook Page'
        }],
        engagement: {
          likes: 0,
          comments: 0,
          shares: 0,
          views: 0,
          sent: 0,
          open: 0,
          clicks: 0,
          pendingDM: 0
        },
        author: req.user.id
      }
    ];

    // In a real implementation, you would:
    // 1. Check user's connected social media accounts
    // 2. Use platform APIs to fetch recent posts
    // 3. Save new posts to database
    // 4. Return the fetched posts

    // For demo purposes, create sample posts
    const createdPosts = await Post.insertMany(mockPosts);

    res.json({
      success: true,
      message: 'Latest posts fetched successfully',
      data: createdPosts,
      count: createdPosts.length
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get posts statistics
// @route   GET /api/posts/stats
// @access  Private
const getPostsStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await Post.aggregate([
      { $match: { author: userId } },
      {
        $group: {
          _id: null,
          totalPosts: { $sum: 1 },
          linkedPosts: {
            $sum: { $cond: [{ $eq: ['$isLinked', true] }, 1, 0] }
          },
          unlinkedPosts: {
            $sum: { $cond: [{ $eq: ['$isLinked', false] }, 1, 0] }
          },
          totalLikes: { $sum: '$engagement.likes' },
          totalComments: { $sum: '$engagement.comments' },
          totalShares: { $sum: '$engagement.shares' },
          totalViews: { $sum: '$engagement.views' }
        }
      }
    ]);

    const result = stats[0] || {
      totalPosts: 0,
      linkedPosts: 0,
      unlinkedPosts: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      totalViews: 0
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
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  fetchLatestPosts,
  getPostsStats,
};
