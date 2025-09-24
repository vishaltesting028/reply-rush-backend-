const express = require('express');
const axios = require('axios');
const qs = require('querystring');
const crypto = require('crypto');
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const instagramDataFetcher = require('../services/instagramDataFetcher');
const instagramContentPublisher = require('../services/instagramContentPublisher');

const router = express.Router();

// @desc    Get Instagram OAuth authorization URL
// @route   GET /api/instagram/auth
// @access  Private
const getInstagramAuthUrl = async (req, res) => {
  try {
    // Check if required environment variables are set
    if (!process.env.INSTAGRAM_CLIENT_ID) {
      return res.status(500).json({
        success: false,
        message: 'Instagram Client ID not configured'
      });
    }

    if (!process.env.INSTAGRAM_REDIRECT_URI) {
      return res.status(500).json({
        success: false,
        message: 'Instagram Redirect URI not configured'
      });
    }

    // Use environment variables for Instagram OAuth configuration
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    const scopes = 'user_profile,user_media';
    
    // Build the Instagram OAuth URL for Basic Display API
    const oauthParams = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scopes,
      response_type: 'code',
      state: 'instagram_oauth_' + Date.now() // Add state parameter for security
    });
    
    const authUrl = `https://api.instagram.com/oauth/authorize?${oauthParams.toString()}`;
    
    console.log('Generated Instagram auth URL:', authUrl);
    console.log('Environment variables check:', {
      clientId: process.env.INSTAGRAM_CLIENT_ID ? `${process.env.INSTAGRAM_CLIENT_ID.substring(0, 8)}...` : 'Missing',
      redirectUri: process.env.INSTAGRAM_REDIRECT_URI,
      clientSecret: process.env.INSTAGRAM_CLIENT_SECRET ? 'Set' : 'Missing'
    });
    
    res.json({
      success: true,
      data: { authUrl }
    });
  } catch (error) {
    console.error('Error generating Instagram auth URL:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Exchange code for access token
// @route   POST /api/instagram/connect
// @access  Private
const connectInstagram = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code is required'
      });
    }

    // Exchange code for access token
    const tokenResp = await axios.post(
      "https://api.instagram.com/oauth/access_token",
      qs.stringify({
        client_id: process.env.INSTAGRAM_CLIENT_ID,
        client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
        grant_type: "authorization_code",
        redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
        code
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token, user_id } = tokenResp.data;

    // Try to get user profile information with username
    let username = null;
    
    try {
      // First try the Graph API endpoint for username
      const userResp = await axios.get(
        `https://graph.instagram.com/me?fields=id,username&access_token=${access_token}`
      );
      username = userResp.data.username;
      console.log('Instagram Graph API Response:', userResp.data);
    } catch (graphError) {
      console.log('Graph API failed, trying Basic Display API:', graphError.response?.data);
      
      try {
        // Fallback to Basic Display API
        const basicResp = await axios.get(
          `https://graph.instagram.com/me?fields=id,account_type&access_token=${access_token}`
        );
        console.log('Instagram Basic Display API Response:', basicResp.data);
        // Use user_id as username if no username available
        username = `user_${user_id}`;
      } catch (basicError) {
        console.log('Basic Display API also failed:', basicError.response?.data);
        username = `instagram_${user_id}`;
      }
    }
    
    console.log('Final username to save:', username);

    // Find user in database (for now using first user as demo)
    const user = await User.findOne();
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Fetch complete Instagram profile data
    let profileData = null;
    try {
      const profileResp = await axios.get(
        `https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${access_token}`
      );
      profileData = profileResp.data;
      console.log('Instagram profile data:', profileData);
    } catch (profileError) {
      console.log('Could not fetch profile data:', profileError.response?.data);
    }

    // Update user's Instagram connection in database with complete data
    user.instagram = {
      username: username,
      accessToken: access_token,
      instagramUserId: user_id,
      accountType: profileData?.account_type?.toUpperCase() || 'PERSONAL',
      mediaCount: profileData?.media_count || 0,
      isConnected: true,
      connectedAt: new Date(),
      lastSyncAt: new Date(),
      profile: {
        id: profileData?.id || user_id,
        username: profileData?.username || username,
        accountType: profileData?.account_type || 'PERSONAL',
        mediaCount: profileData?.media_count || 0,
        lastUpdated: new Date()
      }
    };

    console.log('Before saving - user.instagram:', user.instagram);
    await user.save();
    console.log('After saving - user.instagram:', user.instagram);

    // Fetch and store comprehensive Instagram data using the data fetcher service
    console.log('🔄 Starting comprehensive Instagram data sync for user:', username);
    const syncResult = await instagramDataFetcher.syncInstagramData(user._id, access_token);
    
    if (syncResult.success) {
      console.log('✅ Instagram data sync completed:', syncResult.data);
    } else {
      console.warn('⚠️ Instagram data sync failed, but connection established:', syncResult.error);
    }

    res.json({
      success: true,
      message: 'Instagram account connected successfully',
      data: {
        username: user.instagram.username,
        isConnected: user.instagram.isConnected,
        connectedAt: user.instagram.connectedAt,
        profilePicture: user.instagram.profilePictureUrl,
        followersCount: user.instagram.followersCount,
        postsCount: user.instagram.mediaCount,
        website: user.instagram.website,
        fullName: user.instagram.profile?.name || user.instagram.username
      }
    });

  } catch (error) {
    console.error('Instagram OAuth error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to connect Instagram account'
    });
  }
};

// @desc    Get Instagram profile
// @route   GET /api/instagram/profile
// @access  Private
const getInstagramProfile = async (req, res) => {
  try {
    const accessToken = req.query.access_token;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Access token is required'
      });
    }

    const response = await axios.get(
      `https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`
    );

    res.json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Instagram profile'
    });
  }
};

// @desc    Disconnect Instagram account
// @route   POST /api/instagram/disconnect
// @access  Private
const disconnectInstagram = async (req, res) => {
  try {
    // Find user in database (for now using first user as demo)
    const user = await User.findOne();
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Clear Instagram connection data
    user.instagram = {
      username: null,
      accessToken: null,
      instagramUserId: null,
      accountType: null,
      mediaCount: 0,
      followersCount: 0,
      followingCount: 0,
      biography: null,
      website: null,
      profilePictureUrl: null,
      isConnected: false,
      connectedAt: null,
      lastSyncAt: null,
      media: [],
      profile: null
    };

    await user.save();

    res.json({
      success: true,
      message: 'Instagram account disconnected successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get Instagram connection status
// @route   GET /api/instagram/status
// @access  Private
const getInstagramStatus = async (req, res) => {
  try {
    console.log('🔍 Backend: Checking Instagram status...');
    
    // Find user in database (for now using first user as demo)
    const user = await User.findOne();
    
    if (!user) {
      console.log('❌ Backend: No user found in database');
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Return comprehensive Instagram connection status matching frontend expectations
    const instagramData = user.instagram || {};
    
    console.log('📊 Backend: Instagram data from DB:', {
      username: instagramData.username,
      isConnected: instagramData.isConnected,
      hasAccessToken: !!instagramData.accessToken,
      connectedAt: instagramData.connectedAt
    });
    
    const responseData = {
      success: true,
      data: {
        username: instagramData.username || null,
        isConnected: instagramData.isConnected || false,
        connectedAt: instagramData.connectedAt || null,
        lastSyncAt: instagramData.lastSyncAt || null,
        accountType: instagramData.accountType || null,
        mediaCount: instagramData.mediaCount || 0,
        followersCount: instagramData.followersCount || 0,
        followingCount: instagramData.followingCount || 0,
        biography: instagramData.biography || null,
        website: instagramData.website || null,
        profilePicture: instagramData.profilePictureUrl || null,
        profilePictureUrl: instagramData.profilePictureUrl || null,
        postsCount: instagramData.mediaCount || 0,
        postsStored: instagramData.media?.length || 0,
        fullName: instagramData.profile?.name || instagramData.username || null,
        profile: instagramData.profile || null
      }
    };
    
    console.log('✅ Backend: Sending status response:', responseData.data.isConnected ? 'CONNECTED' : 'NOT CONNECTED');
    res.json(responseData);

  } catch (error) {
    console.error('❌ Backend: Error getting Instagram status:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Fetch Instagram posts
// @route   GET /api/instagram/posts
// @access  Private
const getInstagramPosts = async (req, res) => {
  try {
    // Find user in database (for now using first user as demo)
    const user = await User.findOne();
    
    // Use environment token as fallback if user doesn't have one or isn't connected
    let accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    
    if (user && user.instagram?.isConnected && user.instagram.accessToken) {
      accessToken = user.instagram.accessToken;
    }
    
    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Instagram account not connected and no access token configured'
      });
    }

    // Fetch Instagram posts using Business API
    let response;
    try {
      // First try to get Instagram Business Account ID
      const accountsResp = await axios.get(`https://graph.facebook.com/me/accounts?fields=instagram_business_account&access_token=${accessToken}`);
      
      if (accountsResp.data.data && accountsResp.data.data.length > 0) {
        const instagramBusinessAccount = accountsResp.data.data[0].instagram_business_account;
        if (instagramBusinessAccount) {
          // Use Instagram Business API
          response = await axios.get(`https://graph.facebook.com/${instagramBusinessAccount.id}/media`, {
            params: {
              fields: 'id,caption,media_type,media_url,thumbnail_url,timestamp,permalink,comments_count,like_count',
              access_token: accessToken,
              limit: 25
            }
          });
        }
      }
    } catch (businessError) {
      console.log('Business API failed, trying Basic Display API:', businessError.response?.data);
    }
    
    // Fallback to Basic Display API if Business API fails
    if (!response) {
      response = await axios.get(`https://graph.instagram.com/me/media`, {
        params: {
          fields: 'id,caption,media_type,media_url,thumbnail_url,timestamp,permalink',
          access_token: accessToken,
          limit: 25
        }
      });
    }

    const instagramPosts = response.data.data || [];
    
    // Transform Instagram API response to match your app's format
    const transformedPosts = instagramPosts.map(post => ({
      id: post.id,
      image: post.media_type === 'VIDEO' ? post.thumbnail_url : post.media_url,
      caption: post.caption || '',
      publishDate: post.timestamp,
      isLinked: false, // Default to false, you can implement linking logic
      mediaType: post.media_type,
      permalink: post.permalink,
      engagement: {
        likes: post.like_count || 0, // Use actual like count from Business API if available
        comments: post.comments_count || 0, // Use actual comment count from Business API if available
        shares: 0
      }
    }));

    // Separate linked and unlinked posts (for now all are unlinked)
    const linkedPosts = transformedPosts.filter(post => post.isLinked);
    const unlinkedPosts = transformedPosts.filter(post => !post.isLinked);

    console.log(`📸 Fetched ${transformedPosts.length} Instagram posts for user: ${user.instagram.username}`);

    res.json({
      success: true,
      data: {
        linkedPosts,
        unlinkedPosts,
        total: transformedPosts.length,
        username: user.instagram.username
      }
    });

  } catch (error) {
    console.error('❌ Error fetching Instagram posts:', error.response?.data || error.message);
    
    // Handle specific Instagram API errors
    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false,
        message: 'Instagram access token expired or invalid. Please reconnect your account.'
      });
    }
    
    if (error.response?.status === 400) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request to Instagram API. Please check your account permissions.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to fetch Instagram posts',
      error: error.response?.data?.error?.message || error.message
    });
  }
};

const InstagramWebhookHandler = require('../services/webhookHandler');

// @desc    Instagram webhook endpoint for verification and events
// @route   GET/POST /api/instagram/webhook
// @access  Public
const instagramWebhook = async (req, res) => {
  // Set headers to prevent caching
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  if (req.method === 'GET') {
    // Webhook verification for Meta/Instagram
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('Instagram webhook verification request:', { 
      mode, 
      token: token ? `${token.substring(0, 10)}...` : 'Missing',
      challenge,
      expectedToken: process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN ? 'Set' : 'Missing'
    });

    // Verify the mode and token match what's configured in Meta dashboard
    if (mode && token) {
      if (mode === 'subscribe' && token === process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN) {
        console.log('✅ Instagram webhook verified successfully!');
        return res.status(200).send(challenge);
      } else {
        console.log('❌ Instagram webhook verification failed - token mismatch');
        return res.status(403).send('Forbidden');
      }
    } else {
      console.log('❌ Instagram webhook verification failed - missing parameters');
      return res.status(400).send('Bad Request');
    }
  } else if (req.method === 'POST') {
    try {
      // Event notification
      const signature = req.headers['x-hub-signature-256'];
      
      if (signature && process.env.INSTAGRAM_CLIENT_SECRET) {
        // Validate signature
        const expectedSignature = crypto
          .createHmac('sha256', process.env.INSTAGRAM_CLIENT_SECRET)
          .update(JSON.stringify(req.body))
          .digest('hex');
        
        if (signature !== `sha256=${expectedSignature}`) {
          console.log('Instagram webhook signature validation failed');
          return res.status(403).send('Forbidden');
        }
      }

      console.log('Instagram webhook POST received:', JSON.stringify(req.body, null, 2));

      // Process the webhook event using the handler service
      await InstagramWebhookHandler.processWebhookEvent(req.body);

      return res.status(200).json({ success: true, message: 'Webhook processed successfully' });
    } catch (error) {
      console.error('Error processing webhook:', error);
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  } else {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }
};

// Remove authentication middleware for development
router.get('/auth', getInstagramAuthUrl);
router.post('/connect', connectInstagram);
router.get('/profile', getInstagramProfile);
router.post('/disconnect', disconnectInstagram);
router.get('/status', getInstagramStatus);
router.get('/posts', getInstagramPosts);

// @desc    Enable Page subscriptions for Instagram webhooks
// @route   POST /api/instagram/enable-page-subscriptions
// @access  Private
const enablePageSubscriptions = async (req, res) => {
  try {
    const { pageId, pageAccessToken } = req.body;

    if (!pageId || !pageAccessToken) {
      return res.status(400).json({
        success: false,
        message: 'Page ID and Page Access Token are required'
      });
    }

    // Subscribe to Page fields required for Instagram webhooks
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${pageId}/subscribed_apps`,
      {
        subscribed_fields: 'feed,mention,name,picture',
        access_token: pageAccessToken
      }
    );

    console.log('Page subscriptions enabled:', response.data);

    res.json({
      success: true,
      message: 'Page subscriptions enabled successfully',
      data: response.data
    });

  } catch (error) {
    console.error('Error enabling page subscriptions:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: error.response?.data?.error?.message || 'Failed to enable page subscriptions'
    });
  }
};

// @desc    Instagram OAuth callback handler (for webhook verification)
// @route   GET /api/instagram/callback
// @access  Public
const instagramCallback = async (req, res) => {
  // This endpoint handles Meta's webhook verification for Instagram
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('Instagram callback verification:', { 
    mode, 
    token: token ? `${token.substring(0, 10)}...` : 'Missing',
    challenge 
  });

  if (mode && token) {
    if (mode === 'subscribe' && token === process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN) {
      console.log('✅ Instagram callback webhook verified successfully!');
      return res.status(200).send(challenge);
    } else {
      console.log('❌ Instagram callback verification failed - token mismatch');
      return res.status(403).send('Forbidden');
    }
  } else {
    console.log('❌ Instagram callback verification failed - missing parameters');
    return res.status(400).send('Bad Request');
  }
};

// Webhook endpoint - no auth middleware needed for webhooks
router.get('/webhook', instagramWebhook);
router.post('/webhook', instagramWebhook);

// @desc    Instagram OAuth callback handler
// @route   GET /api/instagram/oauth/instagram/callback
// @access  Public
const instagramOAuthCallback = async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      console.log('Instagram OAuth error:', error);
      // Return HTML that sends message to parent window for popup flow
      return res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'INSTAGRAM_AUTH_ERROR',
                  error: '${error}'
                }, '${process.env.FRONTEND_URL || 'http://localhost:3000'}');
                window.close();
              } else {
                window.location.href = '${process.env.FRONTEND_URL || 'http://localhost:3000'}?error=${error}';
              }
            </script>
          </body>
        </html>
      `);
    }

    if (!code) {
      console.log('No authorization code received');
      return res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'INSTAGRAM_AUTH_ERROR',
                  error: 'no_code'
                }, '${process.env.FRONTEND_URL || 'http://localhost:3000'}');
                window.close();
              } else {
                window.location.href = '${process.env.FRONTEND_URL || 'http://localhost:3000'}?error=no_code';
              }
            </script>
          </body>
        </html>
      `);
    }

    console.log('Instagram OAuth callback received:', { code: code.substring(0, 10) + '...', state });

    // Exchange code for access token using environment variables
    const tokenResp = await axios.post(
      "https://api.instagram.com/oauth/access_token",
      qs.stringify({
        client_id: process.env.INSTAGRAM_CLIENT_ID,
        client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
        grant_type: "authorization_code",
        redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
        code
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token, user_id } = tokenResp.data;
    console.log('Instagram token exchange successful:', { user_id });

    // Get user profile information using Instagram Business API
    let username = null;
    let profileData = null;
    
    try {
      // For Instagram Business API, we need to get the Instagram Business Account ID first
      const userResp = await axios.get(
        `https://graph.facebook.com/me/accounts?fields=instagram_business_account&access_token=${access_token}`
      );
      
      if (userResp.data.data && userResp.data.data.length > 0) {
        const instagramBusinessAccount = userResp.data.data[0].instagram_business_account;
        if (instagramBusinessAccount) {
          // Get Instagram Business Account details
          const profileResp = await axios.get(
            `https://graph.facebook.com/${instagramBusinessAccount.id}?fields=id,username,account_type,media_count,profile_picture_url&access_token=${access_token}`
          );
          profileData = profileResp.data;
          username = profileResp.data.username;
          console.log('Instagram Business profile data:', profileData);
        }
      }
      
      // Fallback to Basic Display API if Business API fails
      if (!username) {
        const basicResp = await axios.get(
          `https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${access_token}`
        );
        profileData = basicResp.data;
        username = basicResp.data.username;
        console.log('Instagram Basic Display profile data:', profileData);
      }
    } catch (error) {
      console.log('Could not fetch profile data:', error.response?.data);
      username = `user_${user_id}`;
    }

    // Find or create user and save Instagram connection
    let user = await User.findOne();
    if (!user) {
      // Create a new user if none exists
      user = new User({ 
        email: 'instagram@user.com', 
        name: 'Instagram User',
        password: 'defaultpassword123' // Required field
      });
    }
    
    user.instagram = {
      username: username,
      accessToken: access_token,
      instagramUserId: user_id,
      accountType: profileData?.account_type?.toUpperCase() || 'PERSONAL',
      mediaCount: profileData?.media_count || 0,
      isConnected: true,
      connectedAt: new Date(),
      lastSyncAt: new Date(),
      profile: {
        id: profileData?.id || user_id,
        username: profileData?.username || username,
        accountType: profileData?.account_type || 'PERSONAL',
        mediaCount: profileData?.media_count || 0,
        lastUpdated: new Date()
      }
    };

    await user.save();
    console.log('Instagram account connected successfully for user:', username);

    // Fetch and store comprehensive Instagram data using the data fetcher service
    console.log('🔄 Starting comprehensive Instagram data sync for user:', username);
    const syncResult = await instagramDataFetcher.syncInstagramData(user._id, access_token);
    
    if (syncResult.success) {
      console.log('✅ Instagram data sync completed:', syncResult.data);
    } else {
      console.warn('⚠️ Instagram data sync failed, but connection established:', syncResult.error);
    }

    // Return HTML that sends success message to parent window for popup flow
    return res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'INSTAGRAM_AUTH_SUCCESS',
                data: {
                  username: '${username}',
                  isConnected: true,
                  connectedAt: '${user.instagram.connectedAt.toISOString()}'
                }
              }, '${process.env.FRONTEND_URL || 'http://localhost:3000'}');
              window.close();
            } else {
              window.location.href = '${process.env.FRONTEND_URL || 'http://localhost:3000'}?success=true&username=${username}';
            }
          </script>
        </body>
      </html>
    `);

  } catch (error) {
    console.error('Instagram OAuth callback error:', error.response?.data || error.message);
    return res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'INSTAGRAM_AUTH_ERROR',
                error: 'oauth_failed'
              }, '${process.env.FRONTEND_URL || 'http://localhost:3000'}');
              window.close();
            } else {
              window.location.href = '${process.env.FRONTEND_URL || 'http://localhost:3000'}?error=oauth_failed';
            }
          </script>
        </body>
      </html>
    `);
  }
};

// @desc    Facebook Graph API OAuth callback handler (improved approach)
// @route   GET /api/instagram/auth/instagram/callback
// @access  Public
const facebookGraphOAuthCallback = async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      console.log('Instagram OAuth error:', error);
      return res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'INSTAGRAM_AUTH_ERROR',
                  error: '${error}'
                }, '${process.env.FRONTEND_URL || 'http://localhost:3000'}');
                window.close();
              } else {
                window.location.href = '${process.env.FRONTEND_URL || 'http://localhost:3000'}?error=${error}';
              }
            </script>
          </body>
        </html>
      `);
    }

    if (!code) {
      console.log('No authorization code received');
      return res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'INSTAGRAM_AUTH_ERROR',
                  error: 'no_code'
                }, '${process.env.FRONTEND_URL || 'http://localhost:3000'}');
                window.close();
              } else {
                window.location.href = '${process.env.FRONTEND_URL || 'http://localhost:3000'}?error=no_code';
              }
            </script>
          </body>
        </html>
      `);
    }

    console.log('Facebook Graph OAuth callback received:', { code: code.substring(0, 10) + '...', state });

    // Exchange code for access token using Facebook Graph API
    const appId = process.env.INSTAGRAM_CLIENT_ID || process.env.INSTAGRAM_CLIENT_ID;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
    const appSecret = process.env.INSTAGRAM_CLIENT_SECRET || process.env.INSTAGRAM_CLIENT_SECRET;

    if (!appId || !redirectUri || !appSecret) {
      throw new Error('Missing required Instagram/Facebook app configuration');
    }

    // Exchange code for a user access token (via Facebook Graph)
    const tokenRes = await axios.get('https://graph.facebook.com/v16.0/oauth/access_token', {
      params: {
        client_id: appId,
        redirect_uri: redirectUri,
        client_secret: appSecret,
        code
      }
    });

    const { access_token } = tokenRes.data;
    console.log('Facebook Graph token exchange successful');

    // Exchange for long-lived token
    let longLivedToken = access_token;
    try {
      const longLivedRes = await axios.get('https://graph.facebook.com/v16.0/oauth/access_token', {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: appId,
          client_secret: appSecret,
          fb_exchange_token: access_token
        }
      });
      longLivedToken = longLivedRes.data.access_token;
      console.log('Long-lived token obtained successfully');
    } catch (error) {
      console.log('Could not exchange for long-lived token, using short-lived token:', error.response?.data);
    }

    // Get user's Facebook pages to find Instagram Business Account
    let instagramBusinessAccountId = null;
    let pageAccessToken = null;
    let username = null;
    let profileData = null;

    try {
      // Get user's Facebook pages
      const pagesRes = await axios.get('https://graph.facebook.com/v16.0/me/accounts', {
        params: {
          fields: 'id,name,access_token,instagram_business_account',
          access_token: longLivedToken
        }
      });

      // Find page with Instagram Business Account
      for (const page of pagesRes.data.data) {
        if (page.instagram_business_account) {
          instagramBusinessAccountId = page.instagram_business_account.id;
          pageAccessToken = page.access_token;
          break;
        }
      }

      if (instagramBusinessAccountId && pageAccessToken) {
        // Get Instagram Business Account details
        const instagramRes = await axios.get(`https://graph.facebook.com/v16.0/${instagramBusinessAccountId}`, {
          params: {
            fields: 'id,username,name,biography,website,followers_count,follows_count,media_count,profile_picture_url',
            access_token: pageAccessToken
          }
        });

        profileData = instagramRes.data;
        username = profileData.username;
        console.log('Instagram Business Account data:', profileData);
      } else {
        // Fallback: try to get basic user info
        const userRes = await axios.get('https://graph.facebook.com/v16.0/me', {
          params: {
            fields: 'id,name',
            access_token: longLivedToken
          }
        });
        username = `facebook_${userRes.data.id}`;
        console.log('Using Facebook user as fallback:', userRes.data);
      }
    } catch (error) {
      console.log('Could not fetch Instagram Business Account data:', error.response?.data);
      username = `user_${Date.now()}`;
    }

    // Find or create user and save Instagram connection
    let user = await User.findOne();
    if (!user) {
      user = new User({ 
        email: 'instagram@user.com', 
        name: 'Instagram User',
        password: 'defaultpassword123'
      });
    }
    
    user.instagram = {
      username: username,
      accessToken: pageAccessToken || longLivedToken, // Use page access token if available
      instagramUserId: instagramBusinessAccountId || `fb_${Date.now()}`,
      accountType: instagramBusinessAccountId ? 'BUSINESS' : 'PERSONAL',
      mediaCount: profileData?.media_count || 0,
      followersCount: profileData?.followers_count || 0,
      followingCount: profileData?.follows_count || 0,
      biography: profileData?.biography || null,
      website: profileData?.website || null,
      profilePictureUrl: profileData?.profile_picture_url || null,
      isConnected: true,
      connectedAt: new Date(),
      lastSyncAt: new Date(),
      profile: {
        id: instagramBusinessAccountId || `fb_${Date.now()}`,
        username: username,
        name: profileData?.name || username,
        accountType: instagramBusinessAccountId ? 'BUSINESS' : 'PERSONAL',
        mediaCount: profileData?.media_count || 0,
        followersCount: profileData?.followers_count || 0,
        followingCount: profileData?.follows_count || 0,
        biography: profileData?.biography || null,
        website: profileData?.website || null,
        profilePictureUrl: profileData?.profile_picture_url || null,
        lastUpdated: new Date()
      },
      // Store both tokens for flexibility
      facebookAccessToken: longLivedToken,
      pageAccessToken: pageAccessToken,
      instagramBusinessAccountId: instagramBusinessAccountId
    };

    await user.save();
    console.log('Instagram account connected successfully via Facebook Graph API for user:', username);

    // Sync Instagram data if we have a business account
    if (instagramBusinessAccountId && pageAccessToken) {
      console.log('🔄 Starting Instagram Business Account data sync for user:', username);
      try {
        const syncResult = await instagramDataFetcher.syncInstagramData(user._id, pageAccessToken);
        if (syncResult.success) {
          console.log('✅ Instagram data sync completed:', syncResult.data);
        } else {
          console.warn('⚠️ Instagram data sync failed:', syncResult.error);
        }
      } catch (syncError) {
        console.warn('⚠️ Instagram data sync error:', syncError.message);
      }
    }

    // Return success response
    return res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'INSTAGRAM_AUTH_SUCCESS',
                data: {
                  username: '${username}',
                  isConnected: true,
                  connectedAt: '${user.instagram.connectedAt.toISOString()}',
                  accountType: '${user.instagram.accountType}',
                  hasBusinessAccount: ${!!instagramBusinessAccountId}
                }
              }, '${process.env.FRONTEND_URL || 'http://localhost:3000'}');
              window.close();
            } else {
              window.location.href = '${process.env.FRONTEND_URL || 'http://localhost:3000'}?success=true&username=${username}';
            }
          </script>
        </body>
      </html>
    `);

  } catch (error) {
    console.error('Facebook Graph OAuth callback error:', error.response?.data || error.message);
    return res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'INSTAGRAM_AUTH_ERROR',
                error: 'oauth_failed',
                details: '${error.message}'
              }, '${process.env.FRONTEND_URL || 'http://localhost:3000'}');
              window.close();
            } else {
              window.location.href = '${process.env.FRONTEND_URL || 'http://localhost:3000'}?error=oauth_failed';
            }
          </script>
        </body>
      </html>
    `);
  }
};

// Instagram OAuth callback endpoint - matches redirect URI in environment variables
router.get('/callback', instagramOAuthCallback);

// Instagram OAuth callback endpoint (alternative path)
router.get('/oauth/instagram/callback', instagramOAuthCallback);

// Facebook Graph API callback endpoint (improved approach)
router.get('/auth/instagram/callback', facebookGraphOAuthCallback);

// Import the utility functions
const { getPostInsights, getComments, replyToComment } = require('../../instagram-posts-fetcher');

// @desc    Get Instagram post insights
// @route   GET /api/instagram/posts/:mediaId/insights
// @access  Private
const getInstagramPostInsights = async (req, res) => {
  try {
    const { mediaId } = req.params;
    const user = await User.findOne();
    
    if (!user || !user.instagram?.isConnected) {
      return res.status(400).json({
        success: false,
        message: 'Instagram account not connected'
      });
    }

    const result = await getPostInsights(mediaId, user.instagram.accessToken);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
        code: result.code
      });
    }

    res.json({
      success: true,
      data: result.data,
      mediaId: result.mediaId
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get Instagram post comments
// @route   GET /api/instagram/posts/:mediaId/comments
// @access  Private
const getInstagramPostComments = async (req, res) => {
  try {
    const { mediaId } = req.params;
    const user = await User.findOne();
    
    if (!user || !user.instagram?.isConnected) {
      return res.status(400).json({
        success: false,
        message: 'Instagram account not connected'
      });
    }

    const result = await getComments(mediaId, user.instagram.accessToken);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
        code: result.code
      });
    }

    res.json({
      success: true,
      data: result.data,
      total: result.total,
      mediaId: result.mediaId
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Reply to Instagram comment
// @route   POST /api/instagram/comments/:commentId/reply
// @access  Private
const replyToInstagramComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { message } = req.body;
    const user = await User.findOne();
    
    if (!user || !user.instagram?.isConnected) {
      return res.status(400).json({
        success: false,
        message: 'Instagram account not connected'
      });
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Reply message is required'
      });
    }

    const result = await replyToComment(commentId, message, user.instagram.accessToken);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
        code: result.code
      });
    }

    res.json({
      success: true,
      data: result.data,
      message: 'Reply sent successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Manually sync Instagram data
// @route   POST /api/instagram/sync
// @access  Private
const syncInstagramData = async (req, res) => {
  try {
    // Find user in database (for now using first user as demo)
    const user = await User.findOne();
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.instagram?.isConnected || !user.instagram.accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Instagram account not connected'
      });
    }

    console.log('🔄 Manual Instagram data sync requested for user:', user.instagram.username);
    
    // Use the comprehensive data fetcher service
    const syncResult = await instagramDataFetcher.syncInstagramData(user._id, user.instagram.accessToken);
    
    if (!syncResult.success) {
      return res.status(400).json({
        success: false,
        message: syncResult.error
      });
    }

    res.json({
      success: true,
      message: 'Instagram data synced successfully',
      data: syncResult.data
    });

  } catch (error) {
    console.error('Manual Instagram sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync Instagram data'
    });
  }
};

// @desc    Upload single photo to Instagram
// @route   POST /api/instagram/upload/photo
// @access  Private
const uploadInstagramPhoto = async (req, res) => {
  try {
    const { imageUrl, caption } = req.body;
    const user = await User.findOne();
    
    if (!user || !user.instagram?.isConnected) {
      return res.status(400).json({
        success: false,
        message: 'Instagram account not connected'
      });
    }

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required'
      });
    }

    const result = await instagramContentPublisher.uploadSinglePhoto(
      user.instagram.accessToken,
      imageUrl,
      caption || ''
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
        code: result.code
      });
    }

    res.json({
      success: true,
      message: 'Photo uploaded successfully to Instagram',
      data: result.data
    });

  } catch (error) {
    console.error('Error uploading photo to Instagram:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Upload carousel to Instagram
// @route   POST /api/instagram/upload/carousel
// @access  Private
const uploadInstagramCarousel = async (req, res) => {
  try {
    const { imageUrls, caption } = req.body;
    const user = await User.findOne();
    
    if (!user || !user.instagram?.isConnected) {
      return res.status(400).json({
        success: false,
        message: 'Instagram account not connected'
      });
    }

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 image URLs are required for carousel'
      });
    }

    const result = await instagramContentPublisher.uploadCarousel(
      user.instagram.accessToken,
      imageUrls,
      caption || ''
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
        code: result.code
      });
    }

    res.json({
      success: true,
      message: 'Carousel uploaded successfully to Instagram',
      data: result.data
    });

  } catch (error) {
    console.error('Error uploading carousel to Instagram:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Upload video to Instagram
// @route   POST /api/instagram/upload/video
// @access  Private
const uploadInstagramVideo = async (req, res) => {
  try {
    const { videoUrl, caption, thumbnailUrl } = req.body;
    const user = await User.findOne();
    
    if (!user || !user.instagram?.isConnected) {
      return res.status(400).json({
        success: false,
        message: 'Instagram account not connected'
      });
    }

    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        message: 'Video URL is required'
      });
    }

    const result = await instagramContentPublisher.uploadVideo(
      user.instagram.accessToken,
      videoUrl,
      caption || '',
      thumbnailUrl
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
        code: result.code
      });
    }

    res.json({
      success: true,
      message: 'Video uploaded successfully to Instagram',
      data: result.data
    });

  } catch (error) {
    console.error('Error uploading video to Instagram:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Upload story to Instagram
// @route   POST /api/instagram/upload/story
// @access  Private
const uploadInstagramStory = async (req, res) => {
  try {
    const { mediaUrl, mediaType } = req.body;
    const user = await User.findOne();
    
    if (!user || !user.instagram?.isConnected) {
      return res.status(400).json({
        success: false,
        message: 'Instagram account not connected'
      });
    }

    if (!mediaUrl) {
      return res.status(400).json({
        success: false,
        message: 'Media URL is required'
      });
    }

    const result = await instagramContentPublisher.uploadStory(
      user.instagram.accessToken,
      mediaUrl,
      mediaType || 'IMAGE'
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
        code: result.code
      });
    }

    res.json({
      success: true,
      message: 'Story uploaded successfully to Instagram',
      data: result.data
    });

  } catch (error) {
    console.error('Error uploading story to Instagram:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get media upload status
// @route   GET /api/instagram/upload/status/:containerId
// @access  Private
const getUploadStatus = async (req, res) => {
  try {
    const { containerId } = req.params;
    const user = await User.findOne();
    
    if (!user || !user.instagram?.isConnected) {
      return res.status(400).json({
        success: false,
        message: 'Instagram account not connected'
      });
    }

    const result = await instagramContentPublisher.getMediaStatus(
      user.instagram.accessToken,
      containerId
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Error getting upload status:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Add new routes
router.get('/posts/:mediaId/insights', getInstagramPostInsights);
router.get('/posts/:mediaId/comments', getInstagramPostComments);
router.post('/comments/:commentId/reply', replyToInstagramComment);
router.post('/sync', syncInstagramData);

// Upload routes
router.post('/upload/photo', uploadInstagramPhoto);
router.post('/upload/carousel', uploadInstagramCarousel);
router.post('/upload/video', uploadInstagramVideo);
router.post('/upload/story', uploadInstagramStory);
router.get('/upload/status/:containerId', getUploadStatus);

// Page subscriptions endpoint
router.post('/enable-page-subscriptions', enablePageSubscriptions);

module.exports = router;
