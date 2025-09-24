const express = require('express');
const axios = require('axios');
const User = require('../models/User');

const router = express.Router();

// Environment variables for Instagram Basic Display API
const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID;
const INSTAGRAM_CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET;
const REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/instagram-direct/callback`;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// @desc    Instagram Basic Display API OAuth (Direct Instagram OAuth)
// @route   GET /auth/instagram-direct
// @access  Public
router.get('/instagram-direct', (req, res) => {
  try {
    if (!INSTAGRAM_CLIENT_ID || !REDIRECT_URI) {
      return res.status(500).json({
        success: false,
        message: 'Instagram OAuth configuration incomplete'
      });
    }

    // Instagram Basic Display API OAuth URL
    const state = `ig_oauth_${Date.now()}_${Math.random().toString(36).substr(2, 9)           }`;
    
    const authUrl = `https://api.instagram.com/oauth/authorize?` +
      `client_id=${INSTAGRAM_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&scope=user_profile,user_media` +
      `&response_type=code` +
      `&state=${state}`;
    
    console.log('🔗 Instagram Basic Display OAuth URL:', authUrl);
    
    res.redirect(authUrl);
  } catch (error) {
    console.error('Error initiating Instagram OAuth:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate Instagram OAuth'
    });
  }
});

// @desc    Instagram Basic Display API OAuth callback
// @route   GET /auth/instagram-direct/callback
// @access  Public
router.get('/instagram-direct/callback', async (req, res) => {
  try {
    const code = req.query.code;
    const error = req.query.error;
 
    if (error) {
      console.log('❌ Instagram OAuth error:', error);
      
      return res.send(`
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
            <h2 style="color: #e74c3c;">Instagram Connection Failed</h2>
            <p><strong>Error:</strong> ${error}</p>
            <button onclick="window.close()" style="background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Close Window</button>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'INSTAGRAM_AUTH_ERROR',
                  error: '${error}'
                }, '*');
                setTimeout(() => window.close(), 3000);
              }
            </script>
          </body>
        </html>
      `);
    }

    if (!code) {
      return res.status(400).send('No authorization code received');
    }

    console.log('✅ Instagram authorization code received');

    // Exchange code for access token
    const tokenResponse = await axios.post('https://api.instagram.com/oauth/access_token', {
      client_id: INSTAGRAM_CLIENT_ID,
      client_secret: INSTAGRAM_CLIENT_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI,
      code: code
    });

    const accessToken = tokenResponse.data.access_token;
    console.log('✅ Instagram access token obtained');

    // Exchange short-lived token for long-lived token
    let longLivedToken = accessToken;
    try {
      const longLivedResponse = await axios.get('https://graph.instagram.com/access_token', {
        params: {
          grant_type: 'ig_exchange_token',
          client_secret: INSTAGRAM_CLIENT_SECRET,
          access_token: accessToken
        }
      });
      longLivedToken = longLivedResponse.data.access_token;
      console.log('✅ Long-lived token obtained');
    } catch (error) {
      console.log('⚠️ Could not get long-lived token, using short-lived token:', error.response?.data);
    }

    // Get Instagram user profile using Basic Display API
    const igResponse = await axios.get('https://graph.instagram.com/me', {
      params: {
        fields: 'id,username,account_type,media_count',
        access_token: longLivedToken
      }
    });

    console.log('📊 Instagram Basic Display API Response:', JSON.stringify(igResponse.data, null, 2));

    const instagramData = igResponse.data;

    // Save to database
    let user = await User.findOne();
    if (!user) {
      user = new User({
        email: 'instagram@user.com',
        name: instagramData.name || instagramData.username,
        password: 'defaultpassword123'
      });
    }

    user.instagram = {
      username: instagramData.username || `user_${instagramData.id}`,
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
        username: instagramData.username || `user_${instagramData.id}`,
        accountType: instagramData.account_type || 'PERSONAL',
        mediaCount: instagramData.media_count || 0,
        lastUpdated: new Date()
      }
    };

    await user.save();
    console.log('✅ Instagram Business account connected:', instagramData.username);

    return res.send(`
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
          <h2 style="color: #27ae60;">✅ Instagram Connected Successfully!</h2>
          <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;">
            <p><strong>Account:</strong> @${instagramData.username || `user_${instagramData.id}`}</p>
            <p><strong>Account Type:</strong> ${instagramData.account_type || 'Personal'}</p>
            <p><strong>Posts:</strong> ${instagramData.media_count || 0}</p>
          </div>
          <p>You can close this window now.</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'INSTAGRAM_AUTH_SUCCESS',
                data: {
                  username: '${instagramData.username || `user_${instagramData.id}`}',
                  isConnected: true,
                  connectedAt: '${new Date().toISOString()}',
                  accountType: '${instagramData.account_type?.toUpperCase() || 'PERSONAL'}',
                  followersCount: 0,
                  mediaCount: ${instagramData.media_count || 0},
                  profilePicture: null
                }
              }, '*');
              setTimeout(() => window.close(), 2000);
            }
          </script>
        </body>
      </html>
    `);

  } catch (error) {
    console.error('❌ Instagram OAuth error:', error.response?.data || error.message);
    
    return res.send(`
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
          <h2 style="color: #e74c3c;">Connection Failed</h2>
          <p>Error: ${error.message}</p>
          <button onclick="window.close()" style="background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Close Window</button>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'INSTAGRAM_AUTH_ERROR',
                error: 'connection_failed'
              }, '*');
              setTimeout(() => window.close(), 3000);
            }
          </script>
        </body>
      </html>
    `);
  }
});

module.exports = router;
