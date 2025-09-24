const express = require('express');
const axios = require('axios');
const User = require('../models/User');

const router = express.Router();

// Environment variables for Instagram Business API
const APP_ID = process.env.INSTAGRAM_CLIENT_ID || '786187977156892';
const APP_SECRET = process.env.INSTAGRAM_CLIENT_SECRET;
const REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI || '  https://5ece8457d962.ngrok-free.app/auth/instagram/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// @desc    Instagram OAuth initiation endpoint
// @route   GET /auth/instagram
// @access  Public
router.get('/instagram', (req, res) => {
  console.log('🚀 Instagram OAuth route hit!', req.method, req.url);
  try {
    if (!APP_ID || !REDIRECT_URI) {
      console.error('❌ OAuth Configuration Missing:', {
        APP_ID: APP_ID ? 'Set' : 'Missing',
        REDIRECT_URI: REDIRECT_URI ? 'Set' : 'Missing'
      });
      return res.status(500).json({
        success: false,
        message: 'Instagram OAuth configuration incomplete'
      });
    }

    // Build authorization URL with proper encoding and state parameter
    const state = `instagram_oauth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Debug: Log the exact URL being generated
    console.log('🔍 Debug Info:', {
      APP_ID,
      REDIRECT_URI,
      encodedRedirectUri: encodeURIComponent(REDIRECT_URI)
    });
    
    // Use Instagram Basic Display API instead of Business API
    const authUrl = `https://api.instagram.com/oauth/authorize?` +
      `client_id=${APP_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&scope=user_profile,user_media` +
      `&response_type=code` +
      `&state=${state}`;
    
    console.log('🌐 Full OAuth URL:', authUrl);
    
    console.log('🔗 Instagram OAuth Configuration:', {
      APP_ID: APP_ID ? `${APP_ID.substring(0, 8)}...` : 'Missing',
      REDIRECT_URI,
      authUrl: authUrl.substring(0, 100) + '...'
    });
    
    res.redirect(authUrl);
  } catch (error) {
    console.error('Error initiating Instagram OAuth:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate Instagram OAuth'
    });
  }
});

// @desc    Instagram OAuth callback handler
// @route   GET /auth/instagram/callback
// @access  Public
router.get('/instagram/callback', async (req, res) => {
  try {
    const code = req.query.code;
    const error = req.query.error;
    const errorReason = req.query.error_reason;
    const errorDescription = req.query.error_description;

    // Handle OAuth errors with detailed information
    if (error) {
      console.log('❌ Instagram OAuth error:', { error, errorReason, errorDescription });
      
      let userFriendlyMessage = 'Connection failed';
      if (error === 'access_denied') {
        userFriendlyMessage = 'Access denied. Please grant the required permissions.';
      } else if (errorDescription) {
        userFriendlyMessage = errorDescription;
      }
      
      return res.send(`
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
            <h2 style="color: #e74c3c;">Instagram Connection Failed</h2>
            <p><strong>Error:</strong> ${userFriendlyMessage}</p>
            <p style="color: #666; font-size: 14px;">Technical details: ${error}</p>
            <button onclick="window.close()" style="background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Close Window</button>
            <br><br>
            <a href="https://instagram.com" target="_blank" style="color: #3498db; text-decoration: none;">
              Open Instagram Directly →
            </a>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'INSTAGRAM_AUTH_ERROR',
                  error: '${error}',
                  message: '${userFriendlyMessage}'
                }, '${FRONTEND_URL}');
                setTimeout(() => window.close(), 3000);
              } else {
                setTimeout(() => {
                  window.location.href = '${FRONTEND_URL}?error=${error}';
                }, 5000);
              }
            </script>
          </body>
        </html>
      `);
    }

    if (!code) {
      console.log('❌ No authorization code received');
      return res.status(400).send('No authorization code received');
    }

    console.log('✅ Authorization code received, exchanging for tokens...');

    // Step 1: Exchange code for access token using Instagram Business API
    const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: APP_ID,
        client_secret: APP_SECRET,
        redirect_uri: REDIRECT_URI,
        code: code
      }
    });

    const shortLivedToken = tokenResponse.data.access_token;
    console.log('✅ Short-lived token obtained');

    // Step 2: Exchange short-lived token for long-lived token
    const longLivedResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: APP_ID,
        client_secret: APP_SECRET,
        fb_exchange_token: shortLivedToken
      }
    });

    const longLivedToken = longLivedResponse.data.access_token;
    console.log('✅ Long-lived token obtained');

    // Step 3: Get Facebook pages to find Instagram Business Account
    console.log('🔍 Fetching Facebook pages to find Instagram Business Account');
    const pagesResponse = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
      params: {
        access_token: longLivedToken,
        fields: 'name,id,instagram_business_account'
      }
    });

    console.log('📄 Facebook Pages Response:', JSON.stringify(pagesResponse.data, null, 2));

    // Find page with Instagram Business Account
    let instagramAccount = null;
    for (const page of pagesResponse.data.data || []) {
      if (page.instagram_business_account) {
        instagramAccount = page.instagram_business_account;
        break;
      }
    }

    if (!instagramAccount) {
      throw new Error('No Instagram Business Account found. Please connect an Instagram Business Account to your Facebook Page first.');
    }

    // Step 4: Get Instagram Business Account details
    const igAccountResponse = await axios.get(`https://graph.facebook.com/v18.0/${instagramAccount.id}`, {
      params: {
        access_token: longLivedToken,
        fields: 'id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url,website'
      }
    });

    console.log('📊 Instagram Business Account Response:', JSON.stringify(igAccountResponse.data, null, 2));

    const instagramData = {
      ...igAccountResponse.data,
      accessToken: longLivedToken,
      userId: igAccountResponse.data.id
    };

    console.log('✅ Instagram Business account found:', {
      username: instagramData.username,
      id: instagramData.id,
      name: instagramData.name
    });

    // Step 5: Get Instagram media using Instagram Business API
    const mediaResponse = await axios.get(`https://graph.facebook.com/v18.0/${instagramAccount.id}/media`, {
      params: {
        fields: 'id,caption,media_url,permalink,timestamp,media_type,thumbnail_url',
        access_token: longLivedToken,
        limit: 25
      }
    });

    // Save user data to database
    let user = await User.findOne();
    if (!user) {
      user = new User({
        email: 'instagram@user.com',
        name: instagramData.name || instagramData.username,
        password: 'defaultpassword123'
      });
    }

    // Ensure username is properly extracted
    const username = instagramData.username || instagramData.name || `ig_user_${instagramData.id}`;
    
    console.log('💾 Saving Instagram data:', {
      originalUsername: instagramData.username,
      finalUsername: username,
      id: instagramData.id,
      name: instagramData.name
    });

    // Update user's Instagram connection
    user.instagram = {
      username: username,
      accessToken: longLivedToken,
      instagramUserId: instagramData.id,
      accountType: 'BUSINESS',
      mediaCount: instagramData.media_count || 0,
      followersCount: instagramData.followers_count || 0,
      followingCount: instagramData.follows_count || 0,
      biography: instagramData.biography || null,
      website: instagramData.website || null,
      profilePictureUrl: instagramData.profile_picture_url || null,
      isConnected: true,
      connectedAt: new Date(),
      lastSyncAt: new Date(),
      profile: {
        id: instagramData.id,
        username: username,
        name: instagramData.name || username,
        accountType: 'BUSINESS',
        mediaCount: instagramData.media_count || 0,
        followersCount: instagramData.followers_count || 0,
        followingCount: instagramData.follows_count || 0,
        biography: instagramData.biography || null,
        website: instagramData.website || null,
        profilePictureUrl: instagramData.profile_picture_url || null,
        lastUpdated: new Date()
      },
      media: mediaResponse.data.data || []
    };

    await user.save();
    console.log('✅ Instagram account connected successfully:', username);
    console.log('📝 Final saved data:', {
      savedUsername: user.instagram.username,
      savedId: user.instagram.instagramUserId,
      savedAccountType: user.instagram.accountType
    });

    // Return success response
    return res.send(`
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
          <h2 style="color: #27ae60;">Instagram Business Account Connected Successfully!</h2>
          <p>Business Account: @${username}</p>
          <p>Followers: ${instagramData.followers_count || 0}</p>
          <p>You can close this window.</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'INSTAGRAM_AUTH_SUCCESS',
                data: {
                  username: '${username}',
                  isConnected: true,
                  connectedAt: '${new Date().toISOString()}',
                  accountType: 'BUSINESS',
                  followersCount: ${instagramData.followers_count || 0},
                  mediaCount: ${instagramData.media_count || 0}
                }
              }, '${FRONTEND_URL}');
              window.close();
            } else {
              setTimeout(() => {
                window.location.href = '${FRONTEND_URL}?success=true&username=${username}';
              }, 2000);
            }
          </script>
        </body>
      </html>
    `);

  } catch (error) {
    console.error('❌ Instagram OAuth callback error:', error.response?.data || error.message);
    
    return res.send(`
      <html>
        <body>
          <h2>Instagram Connection Failed</h2>
          <p>An error occurred during the connection process.</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'INSTAGRAM_AUTH_ERROR',
                error: 'connection_failed'
              }, '${FRONTEND_URL}');
              window.close();
            } else {
              setTimeout(() => {
                window.location.href = '${FRONTEND_URL}?error=connection_failed';
              }, 2000);
            }
          </script>
        </body>
      </html>
    `);
  }
});

// @desc    Instagram OAuth callback (alternative route)
// @route   GET /auth/instagram/callback
// @access  Public
router.get('/callback', async (req, res) => {
  try {
    const code = req.query.code;
    const error = req.query.error;

    if (error) {
      console.log('❌ Instagram OAuth error:', error);
      return res.send(`
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
            <h2 style="color: #e74c3c;">Instagram Connection Failed</h2>
            <p>Error: ${error}</p>
            <p>You can close this window.</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'INSTAGRAM_AUTH_ERROR',
                  error: '${error}'
                }, '${FRONTEND_URL}');
                window.close();
              } else {
                setTimeout(() => {
                  window.location.href = '${FRONTEND_URL}?error=${error}';
                }, 2000);
              }
            </script>
          </body>
        </html>
      `);
    }

    if (!code) {
      console.log('❌ No authorization code received');
      return res.status(400).send('No authorization code received');
    }

    console.log('✅ Authorization code received, exchanging for tokens...');

    // Step 1: Exchange code for access token using Instagram Business API
    const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: APP_ID,
        client_secret: APP_SECRET,
        redirect_uri: REDIRECT_URI,
        code: code
      }
    });

    const shortLivedToken = tokenResponse.data.access_token;
    console.log('✅ Short-lived token obtained');

    // Step 2: Exchange short-lived token for long-lived token
    const longLivedResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: APP_ID,
        client_secret: APP_SECRET,
        fb_exchange_token: shortLivedToken
      }
    });

    const longLivedToken = longLivedResponse.data.access_token;
    console.log('✅ Long-lived token obtained');

    // Step 3: Get Facebook pages to find Instagram Business Account
    console.log('🔍 Fetching Facebook pages to find Instagram Business Account');
    const pagesResponse = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
      params: {
        access_token: longLivedToken,
        fields: 'name,id,instagram_business_account'
      }
    });

    console.log('📄 Facebook Pages Response:', JSON.stringify(pagesResponse.data, null, 2));

    // Find page with Instagram Business Account
    let instagramAccount = null;
    for (const page of pagesResponse.data.data || []) {
      if (page.instagram_business_account) {
        instagramAccount = page.instagram_business_account;
        break;
      }
    }

    if (!instagramAccount) {
      throw new Error('No Instagram Business Account found. Please connect an Instagram Business Account to your Facebook Page first.');
    }

    // Step 4: Get Instagram Business Account details
    const igAccountResponse = await axios.get(`https://graph.facebook.com/v18.0/${instagramAccount.id}`, {
      params: {
        access_token: longLivedToken,
        fields: 'id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url,website'
      }
    });

    console.log('📊 Instagram Business Account Response:', JSON.stringify(igAccountResponse.data, null, 2));

    const instagramData = {
      ...igAccountResponse.data,
      accessToken: longLivedToken,
      userId: igAccountResponse.data.id
    };

    const username = instagramData.username;

    console.log('✅ Instagram Business account found:', {
      username: instagramData.username,
      id: instagramData.id,
      name: instagramData.name
    });

    // Step 5: Get Instagram media using Instagram Business API
    const mediaResponse = await axios.get(`https://graph.facebook.com/v18.0/${instagramAccount.id}/media`, {
      params: {
        fields: 'id,caption,media_url,permalink,timestamp,media_type,thumbnail_url',
        access_token: longLivedToken,
        limit: 25
      }
    });

    // Save user data to database
    let user = await User.findOne();
    if (!user) {
      user = new User({
        instagram: {}
      });
    }

    // Update user's Instagram connection
    user.instagram = {
      username: username,
      accessToken: longLivedToken,
      instagramUserId: instagramData.id,
      accountType: 'BUSINESS',
      mediaCount: instagramData.media_count || 0,
      followersCount: instagramData.followers_count || 0,
      followingCount: instagramData.follows_count || 0,
      biography: instagramData.biography || null,
      website: instagramData.website || null,
      profilePictureUrl: instagramData.profile_picture_url || null,
      isConnected: true,
      connectedAt: new Date(),
      lastSyncAt: new Date(),
      profile: {
        id: instagramData.id,
        username: username,
        name: instagramData.name || username,
        accountType: 'BUSINESS',
        mediaCount: instagramData.media_count || 0,
        followersCount: instagramData.followers_count || 0,
        followingCount: instagramData.follows_count || 0,
        biography: instagramData.biography || null,
        website: instagramData.website || null,
        profilePictureUrl: instagramData.profile_picture_url || null,
        lastUpdated: new Date()
      },
      media: mediaResponse.data.data || []
    };

    await user.save();
    console.log('✅ Instagram account connected successfully:', username);

    // Return success response
    return res.send(`
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
          <h2 style="color: #27ae60;">Instagram Business Account Connected Successfully!</h2>
          <p>Business Account: @${username}</p>
          <p>Followers: ${instagramData.followers_count || 0}</p>
          <p>You can close this window.</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'INSTAGRAM_AUTH_SUCCESS',
                data: {
                  username: '${username}',
                  isConnected: true,
                  connectedAt: '${new Date().toISOString()}',
                  accountType: 'BUSINESS',
                  followersCount: ${instagramData.followers_count || 0},
                  mediaCount: ${instagramData.media_count || 0}
                }
              }, '${FRONTEND_URL}');
              window.close();
            } else {
              setTimeout(() => {
                window.location.href = '${FRONTEND_URL}?success=true&username=${username}';
              }, 2000);
            }
          </script>
        </body>
      </html>
    `);

  } catch (error) {
    console.error('Instagram OAuth callback error:', error);
    return res.send(`
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
          <h2 style="color: #e74c3c;">Instagram Connection Failed</h2>
          <p>Error: ${error.message}</p>
          <p>You can close this window.</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'INSTAGRAM_AUTH_ERROR',
                error: '${error.message}'
              }, '${FRONTEND_URL}');
              window.close();
            } else {
              setTimeout(() => {
                window.location.href = '${FRONTEND_URL}?error=connection_failed';
              }, 2000);
            }
          </script>
        </body>
      </html>
    `);
  }
});

module.exports = router;
