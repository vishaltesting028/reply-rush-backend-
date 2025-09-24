const axios = require('axios');

/**
 * Fetch Instagram posts using the Instagram Basic Display API
 * @param {string} accessToken - Instagram access token
 * @param {number} limit - Number of posts to fetch (default: 25, max: 25)
 * @returns {Promise<Object>} - Posts data with success status
 */
async function getInstagramPosts(accessToken = null, limit = 25) {
  try {
    // Use environment token as fallback
    const token = accessToken || process.env.INSTAGRAM_ACCESS_TOKEN;
    
    if (!token) {
      throw new Error('Access token is required');
    }

    console.log('🔄 Fetching Instagram posts...');

    const response = await axios.get(`https://graph.instagram.com/me/media`, {
      params: {
        fields: 'id,caption,media_type,media_url,thumbnail_url,timestamp,permalink',
        access_token: token,
        limit: Math.min(limit, 25) // Instagram API max limit is 25
      }
    });

    const posts = response.data.data || [];
    
    console.log(`📸 Successfully fetched ${posts.length} posts`);
    
    // Transform posts to a cleaner format
    const transformedPosts = posts.map(post => ({
      id: post.id,
      caption: post.caption || '',
      mediaType: post.media_type,
      mediaUrl: post.media_url,
      thumbnailUrl: post.thumbnail_url,
      timestamp: post.timestamp,
      permalink: post.permalink,
      publishDate: new Date(post.timestamp).toISOString()
    }));

    return {
      success: true,
      data: transformedPosts,
      total: transformedPosts.length,
      paging: response.data.paging || null
    };

  } catch (error) {
    console.error('❌ Error fetching Instagram posts:', error.response?.data || error.message);
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      return {
        success: false,
        error: 'Access token expired or invalid',
        code: 'TOKEN_EXPIRED'
      };
    }
    
    if (error.response?.status === 400) {
      return {
        success: false,
        error: 'Invalid request to Instagram API',
        code: 'BAD_REQUEST',
        details: error.response?.data
      };
    }

    return {
      success: false,
      error: error.response?.data?.error?.message || error.message,
      code: 'API_ERROR'
    };
  }
}

/**
 * Get Instagram post insights/analytics
 * @param {string} mediaId - Instagram media ID
 * @param {string} accessToken - Instagram access token
 * @returns {Promise<Object>} - Post insights data
 */
async function getPostInsights(mediaId, accessToken = null) {
  try {
    // Use environment token as fallback
    const token = accessToken || process.env.INSTAGRAM_ACCESS_TOKEN;
    
    if (!mediaId || !token) {
      throw new Error('Media ID and access token are required');
    }

    console.log(`🔄 Fetching insights for media: ${mediaId}`);

    const response = await axios.get(`https://graph.instagram.com/${mediaId}/insights`, {
      params: {
        metric: 'impressions,reach,engagement',
        access_token: token
      }
    });

    console.log('📊 Insights data:', response.data.data);

    return {
      success: true,
      data: response.data.data,
      mediaId: mediaId
    };

  } catch (error) {
    console.error('❌ Error fetching insights:', error.response?.data || error.message);
    
    if (error.response?.status === 400) {
      return {
        success: false,
        error: 'Insights not available for this media type or account type',
        code: 'INSIGHTS_NOT_AVAILABLE'
      };
    }

    return {
      success: false,
      error: error.response?.data?.error?.message || error.message,
      code: 'INSIGHTS_ERROR'
    };
  }
}

/**
 * Get comments for an Instagram post
 * @param {string} mediaId - Instagram media ID
 * @param {string} accessToken - Instagram access token
 * @returns {Promise<Object>} - Comments data
 */
async function getComments(mediaId, accessToken = null) {
  try {
    // Use environment token as fallback
    const token = accessToken || process.env.INSTAGRAM_ACCESS_TOKEN;
    
    if (!mediaId || !token) {
      throw new Error('Media ID and access token are required');
    }

    console.log(`🔄 Fetching comments for media: ${mediaId}`);

    const response = await axios.get(`https://graph.facebook.com/v19.0/${mediaId}/comments`, {
      params: {
        access_token: token,
        fields: 'id,text,timestamp,username,from'
      }
    });

    console.log('💬 Comments:', response.data.data);

    return {
      success: true,
      data: response.data.data || [],
      total: response.data.data?.length || 0,
      mediaId: mediaId
    };

  } catch (error) {
    console.error('❌ Error fetching comments:', error.response?.data || error.message);
    
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message,
      code: 'COMMENTS_ERROR'
    };
  }
}

/**
 * Reply to an Instagram comment
 * @param {string} commentId - Instagram comment ID
 * @param {string} replyText - Reply message text
 * @param {string} accessToken - Instagram access token
 * @returns {Promise<Object>} - Reply result
 */
async function replyToComment(commentId, replyText, accessToken = null) {
  try {
    // Use environment token as fallback
    const token = accessToken || process.env.INSTAGRAM_ACCESS_TOKEN;
    
    if (!commentId || !replyText || !token) {
      throw new Error('Comment ID, reply text, and access token are required');
    }

    console.log(`🔄 Replying to comment: ${commentId}`);

    const response = await axios.post(`https://graph.facebook.com/v19.0/${commentId}/replies`, null, {
      params: {
        message: replyText,
        access_token: token
      }
    });

    console.log('✅ Reply sent:', response.data);

    return {
      success: true,
      data: response.data,
      commentId: commentId,
      replyText: replyText
    };

  } catch (error) {
    console.error('❌ Error replying to comment:', error.response?.data || error.message);
    
    if (error.response?.status === 400) {
      return {
        success: false,
        error: 'Invalid comment ID or insufficient permissions',
        code: 'REPLY_FAILED'
      };
    }

    return {
      success: false,
      error: error.response?.data?.error?.message || error.message,
      code: 'REPLY_ERROR'
    };
  }
}

/**
 * Get Instagram user profile information
 * @param {string} accessToken - Instagram access token
 * @returns {Promise<Object>} - User profile data
 */
async function getInstagramProfile(accessToken = null) {
  try {
    // Use environment token as fallback
    const token = accessToken || process.env.INSTAGRAM_ACCESS_TOKEN;
    
    if (!token) {
      throw new Error('Access token is required');
    }

    const response = await axios.get(`https://graph.instagram.com/me`, {
      params: {
        fields: 'id,username,account_type,media_count',
        access_token: token
      }
    });

    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    console.error('❌ Error fetching Instagram profile:', error.response?.data || error.message);
    
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message
    };
  }
}

// Example usage (uncomment to test)
/*
const ACCESS_TOKEN = 'YOUR_ACCESS_TOKEN_HERE';

async function testFetch() {
  // Test profile fetch
  const profile = await getInstagramProfile(ACCESS_TOKEN);
  console.log('Profile:', profile);
  
  // Test posts fetch
  const posts = await getInstagramPosts(ACCESS_TOKEN, 10);
  console.log('Posts:', posts);
  
  // Test insights for a specific media
  if (posts.success && posts.data.length > 0) {
    const mediaId = posts.data[0].id;
    const insights = await getPostInsights(mediaId, ACCESS_TOKEN);
    console.log('Insights:', insights);
    
    // Test comments
    const comments = await getComments(mediaId, ACCESS_TOKEN);
    console.log('Comments:', comments);
    
    // Test reply (uncomment and provide real comment ID)
    // const reply = await replyToComment('COMMENT_ID_HERE', 'Thanks for your comment!', ACCESS_TOKEN);
    // console.log('Reply:', reply);
  }
}

// testFetch();
*/

module.exports = {
  getInstagramPosts,
  getInstagramProfile,
  getPostInsights,
  getComments,
  replyToComment
};
