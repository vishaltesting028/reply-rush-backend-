const express = require("express");
const axios = require("axios");
require("dotenv").config();

const router = express.Router();

// Step 1: Redirect user to Instagram login
router.get("/auth/login", (req, res) => {
    const authUrl = `https://api.instagram.com/oauth/authorize
      ?client_id=${process.env.INSTAGRAM_CLIENT_ID}
      &redirect_uri=http://localhost:5000/krunal/auth/instagram/callback
      &scope=user_profile,user_media
      &response_type=code`.replace(/\s+/g, '');
    
    res.redirect(authUrl);
  });
  
  // Step 2: Instagram redirects back with code → Exchange for token
  router.get("/auth/instagram/callback", async (req, res) => {
    const code = req.query.code;
    try {
      const response = await axios.post(
        `https://api.instagram.com/oauth/access_token`,
        {
          client_id: process.env.CLIENT_ID,
          client_secret: process.env.CLIENT_SECRET,
          grant_type: "authorization_code",
          redirect_uri: process.env.REDIRECT_URI,
          code,
        },
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
  
      const tokenData = response.data;
      // Normally you would save this token in a DB
      res.json(tokenData);
    } catch (err) {
      res.status(500).json({ error: err.response?.data || err.message });
    }
  });

module.exports = router;