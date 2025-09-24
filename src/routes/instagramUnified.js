const express = require('express');
const axios = require('axios');
const User = require('../models/User');

const router = express.Router();

// Environment variables for Instagram Basic Display API
const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID;
const INSTAGRAM_CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET;
const REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI || `  https://5ece8457d962.ngrok-free.app/auth/instagram/callback`;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// @desc    Instagram Basic Display API OAuth initiation
// @route   GET /auth/instagram
// @access  Public
router.get('/instagram', (req, res) => {
  try {
    console.log('🚀 Instagram OAuth initiation started');
    console.log('📋 Configuration check:', {
      clientId: INSTAGRAM_CLIENT_ID ? `${INSTAGRAM_CLIENT_ID.substring(0, 8)}...` : 'Missing',
      clientSecret: INSTAGRAM_CLIENT_SECRET ? 'Set' : 'Missing',
      redirectUri: REDIRECT_URI
    });

    if (!INSTAGRAM_CLIENT_ID) {
      return res.status(500).json({
        success: false,
        message: 'Instagram Client ID not configured. Please set INSTAGRAM_CLIENT_ID in environment variables.'
      });
    }

    if (!INSTAGRAM_CLIENT_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'Instagram Client Secret not configured. Please set INSTAGRAM_CLIENT_SECRET in environment variables.'
      });
    }

    // Instagram Basic Display API OAuth URL
    const state = `ig_oauth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const authUrl = `https://api.instagram.com/oauth/authorize?` +
      `client_id=${INSTAGRAM_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&scope=user_profile,user_media` +
      `&response_type=code` +
      `&state=${state}`;
    
    console.log('🔗 Instagram Basic Display OAuth URL generated');
    console.log('🎯 Redirecting to Instagram authorization...');
    
    res.redirect(authUrl);
  } catch (error) {
    console.error('❌ Error initiating Instagram OAuth:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate Instagram OAuth'
    });
  }
});

// @desc    Instagram Basic Display API OAuth callback
// @route   GET /auth/instagram/callback
// @access  Public
router.get('/instagram/callback', async (req, res) => {
  try {
    const code = req.query.code;
    const error = req.query.error;
    const errorReason = req.query.error_reason;
    const errorDescription = req.query.error_description;

    console.log('📨 Instagram OAuth callback received:', {
      hasCode: !!code,
      error: error || 'None',
      errorReason: errorReason || 'None'
    });

    // Handle OAuth errors
    if (error) {
      console.log('❌ Instagram OAuth error:', { error, errorReason, errorDescription });
      
      let userFriendlyMessage = 'Connection failed';
      if (error === 'access_denied') {
        userFriendlyMessage = 'Access denied. Please grant the required permissions.';
      } else if (errorDescription) {
        userFriendlyMessage = errorDescription;
      }
      
      return res.redirect(`${FRONTEND_URL}/connect-account?error=${error}&message=${encodeURIComponent(userFriendlyMessage)}`);
    }

    if (!code) {
      console.log('❌ No authorization code received');
      return res.redirect(`${FRONTEND_URL}/connect-account?error=no_code&message=${encodeURIComponent('No authorization code received')}`);
    }

    console.log('✅ Instagram authorization code received, exchanging for tokens...');

    // Step 1: Exchange code for short-lived access token
    const tokenResponse = await axios.post('https://api.instagram.com/oauth/access_token', {
      client_id: INSTAGRAM_CLIENT_ID,
      client_secret: INSTAGRAM_CLIENT_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI,
      code: code
    });

    const shortLivedToken = tokenResponse.data.access_token;
    const userId = tokenResponse.data.user_id;
    console.log('✅ Short-lived token obtained for user:', userId);

    // Step 2: Exchange short-lived token for long-lived token
    let longLivedToken = shortLivedToken;
    try {
      const longLivedResponse = await axios.get('https://graph.instagram.com/access_token', {
        params: {
          grant_type: 'ig_exchange_token',
          client_secret: INSTAGRAM_CLIENT_SECRET,
          access_token: shortLivedToken
        }
      });
      longLivedToken = longLivedResponse.data.access_token;
      console.log('✅ Long-lived token obtained');
    } catch (error) {
      console.log('⚠️ Could not get long-lived token, using short-lived token:', error.response?.data);
    }

    // Step 3: Get Instagram user profile using Basic Display API
    const profileResponse = await axios.get('https://graph.instagram.com/me', {
      params: {
        fields: 'id,username,account_type,media_count',
        access_token: longLivedToken
      }
    });

    console.log('📊 Instagram Basic Display API Profile Response:', JSON.stringify(profileResponse.data, null, 2));

    const instagramData = profileResponse.data;
    const username = instagramData.username || `user_${instagramData.id}`;

    // Step 4: Save to database
    let user = await User.findOne();
    if (!user) {
      user = new User({
        email: 'instagram@user.com',
        name: username,
        password: 'defaultpassword123'
      });
    }

    user.instagram = {
      username: username,
      accessToken: longLivedToken,
      instagramUserId: instagramData.id,
      accountType: instagramData.account_type?.toUpperCase() || 'PERSONAL',
      mediaCount: instagramData.media_count || 0,
      followersCount: 0, // Basic Display API doesn't provide follower count
      followingCount: 0, // Basic Display API doesn't provide following count
      biography: null, // Basic Display API doesn't provide biography
      website: null, // Basic Display API doesn't provide website
      profilePictureUrl: null, // Basic Display API doesn't provide profile picture
      isConnected: true,
      connectedAt: new Date(),
      lastSyncAt: new Date(),
      profile: {
        id: instagramData.id,
        username: username,
        accountType: instagramData.account_type || 'PERSONAL',
        mediaCount: instagramData.media_count || 0,
        lastUpdated: new Date()
      }
    };

    await user.save();
    console.log('✅ Instagram account connected successfully:', username);

    // Redirect back to frontend with success
    return res.redirect(`${FRONTEND_URL}/connect-account?success=true&username=${encodeURIComponent(username)}`);

  } catch (error) {
    console.error('❌ Instagram OAuth callback error:', error.response?.data || error.message);
    
    let errorMessage = 'Connection failed';
    if (error.response?.data?.error_message) {
      errorMessage = error.response.data.error_message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return res.redirect(`${FRONTEND_URL}/connect-account?error=oauth_failed&message=${encodeURIComponent(errorMessage)}`);
  }
});

// @desc    Get Instagram user media
// @route   GET /auth/instagram/user-media
// @access  Public
router.get('/instagram/user-media', async (req, res) => {
  try {
    const accessToken = req.query.access_token;
    
    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Access token is required'
      });
    }

    console.log('📸 Fetching Instagram user media...');

    // Fetch user media using Instagram Basic Display API
    const response = await axios.get('https://graph.instagram.com/me/media', {
      params: {
        fields: 'id,caption,media_url,media_type,thumbnail_url,timestamp,permalink',
        access_token: accessToken,
        limit: 25
      }
    });

    const mediaData = response.data.data || [];
    
    console.log(`✅ Fetched ${mediaData.length} media items`);

    res.json({
      success: true,
      data: mediaData,
      total: mediaData.length
    });

  } catch (error) {
    console.error('❌ Error fetching Instagram media:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false,
        message: 'Instagram access token expired or invalid. Please reconnect your account.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Instagram media',
      error: error.response?.data?.error?.message || error.message
    });
  }
});

// @desc    Get Instagram user profile
// @route   GET /auth/instagram/profile
// @access  Public
router.get('/instagram/profile', async (req, res) => {
  try {
    const accessToken = req.query.access_token;
    
    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Access token is required'
      });
    }

    console.log('👤 Fetching Instagram user profile...');

    // Fetch user profile using Instagram Basic Display API
    const response = await axios.get('https://graph.instagram.com/me', {
      params: {
        fields: 'id,username,account_type,media_count',
        access_token: accessToken
      }
    });

    console.log('✅ Profile fetched successfully');

    res.json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error('❌ Error fetching Instagram profile:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false,
        message: 'Instagram access token expired or invalid. Please reconnect your account.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Instagram profile',
      error: error.response?.data?.error?.message || error.message
    });
  }
});

module.exports = router;
