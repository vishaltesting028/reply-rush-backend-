const express = require('express');
const axios = require('axios');
const User = require('../models/User');

const router = express.Router();

// Environment variables - Using Facebook Graph API approach
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || process.env.INSTAGRAM_CLIENT_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || process.env.INSTAGRAM_CLIENT_SECRET;
const REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Note: Frontend now handles Instagram OAuth authorization directly
// This route is only needed for the callback

// @desc    Instagram OAuth callback handler (Instagram Basic Display API)
// @route   GET /auth/instagram/callback
// @access  Public
router.get('/instagram/callback', async (req, res) => {

  console.log('----------------------------------------------------');
  
  try {
    const code = req.query.code;
    const error = req.query.error;
    const errorReason = req.query.error_reason;
    const errorDescription = req.query.error_description;

    if (error) {
      console.log('❌ Facebook OAuth error:', { error, errorReason, errorDescription });
      
      return res.send(`
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
            <h2 style="color: #e74c3c;">Instagram Connection Failed</h2>
            <p><strong>Error:</strong> ${errorDescription || error}</p>
            <button onclick="window.close()" style="background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Close Window</button>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'INSTAGRAM_AUTH_ERROR',
                  error: '${error}',
                  message: '${errorDescription || error}'
                }, '${FRONTEND_URL}');
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

    console.log('✅ Authorization code received, exchanging for tokens...');

    // Construct the redirect URI
    const redirectUri = REDIRECT_URI || '  https://5ece8457d962.ngrok-free.appp/auth/instagram/callback';

    // Step 1: Exchange code for access token
    const tokenResponse = await axios.post(
      'https://api.instagram.com/oauth/access_token',
      new URLSearchParams({
        client_id: FACEBOOK_APP_ID,
        client_secret: FACEBOOK_APP_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code: code
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const accessToken = tokenResponse.data.access_token;
    const userId = tokenResponse.data.user_id;

    // Step 2: Fetch user profile
    const userResponse = await axios.get(
      `https://graph.instagram.com/${userId}?fields=id,username&access_token=${accessToken}`
    );

    console.log('✅ Instagram connected successfully:', userResponse.data);

    res.json({
      message: "Instagram connected successfully 🎉",
      accessToken,
      user: userResponse.data,
    });

  } catch (error) {
    console.error('❌ Instagram OAuth callback error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get access token' });
  }
});

module.exports = router;
