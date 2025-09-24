# Instagram Graph API Integration - Setup Guide

This guide explains how to set up and use the production-ready Instagram Graph API integration in your Reply Rush backend.

## 🚀 Quick Start

### 1. Environment Configuration

Add these variables to your `.env` file:

```bash
# Instagram Graph API Configuration (Production)
IG_ACCESS_TOKEN=your_long_lived_instagram_access_token_here
IG_USER_ID=your_instagram_user_id_here
```

### 2. Get Your Credentials

#### Option A: If you already have them (as mentioned)
- Use your existing **long-lived access token** (60-day validity)
- Use your existing **Instagram User ID**

#### Option B: Get them from Facebook Developer Console
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Select your app with Instagram Business API access
3. Go to **Graph API Explorer**
4. Generate a long-lived token for your Instagram Business Account
5. Get your Instagram User ID from the API response

### 3. Test the Integration

Start your server and test the health endpoint:

```bash
npm start
# or
node server.js
```

Test health check:
```bash
curl http://localhost:5000/instagram/health
```

## 📡 API Endpoints

### Base URL: `http://localhost:5000/instagram`

### 1. Health Check
```
GET /instagram/health
```
**Description:** Check service status and configuration
**Response:**
```json
{
  "success": true,
  "message": "Instagram Graph API health check",
  "data": {
    "service_status": "operational",
    "credentials_configured": true,
    "token_status": {
      "valid": true,
      "error": null
    },
    "environment": {
      "has_access_token": true,
      "has_user_id": true,
      "node_env": "development"
    },
    "last_checked": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. Profile Information
```
GET /instagram/profile
```
**Description:** Get Instagram profile info (username, followers_count, media_count)
**Response:**
```json
{
  "success": true,
  "message": "Instagram profile fetched successfully",
  "data": {
    "id": "17841400455970028",
    "username": "your_username",
    "name": "Your Name",
    "biography": "Your bio",
    "website": "https://yourwebsite.com",
    "profile_picture_url": "https://...",
    "account_type": "BUSINESS",
    "media_count": 150,
    "followers_count": 1000,
    "follows_count": 500,
    "last_updated": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3. Recent Posts
```
GET /instagram/posts?limit=25
```
**Description:** Get latest media posts (id, caption, media_url, permalink, timestamp)
**Parameters:**
- `limit` (optional): Number of posts (1-100, default: 25)

**Response:**
```json
{
  "success": true,
  "message": "Fetched 25 Instagram posts",
  "data": {
    "posts": [
      {
        "id": "17841400455970028",
        "caption": "Your post caption",
        "media_type": "IMAGE",
        "media_url": "https://...",
        "thumbnail_url": "https://...",
        "permalink": "https://www.instagram.com/p/...",
        "timestamp": "2024-01-01T00:00:00+0000",
        "username": "your_username",
        "like_count": 100,
        "comments_count": 10,
        "formatted_date": "January 1, 2024"
      }
    ],
    "total_count": 25,
    "has_next_page": true,
    "next_cursor": "cursor_string",
    "last_updated": "2024-01-01T00:00:00.000Z"
  }
}
```

### 4. Validate Token
```
GET /instagram/validate
```
**Description:** Validate your access token
**Response:**
```json
{
  "success": true,
  "valid": true,
  "message": "Instagram access token is valid",
  "data": {
    "user_id": "17841400455970028",
    "username": "your_username",
    "validated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### 5. Account Insights (Business accounts only)
```
GET /instagram/insights?metric=impressions,reach&period=day
```
**Description:** Get account insights and analytics
**Parameters:**
- `metric` (optional): Metrics to fetch (default: impressions,reach,profile_views)
- `period` (optional): Time period - day, week, days_28 (default: day)

### 6. Specific Media
```
GET /instagram/media/:mediaId
```
**Description:** Get specific media post by ID
**Parameters:**
- `mediaId`: Instagram media ID

## 🔧 Frontend Integration Examples

### JavaScript/Fetch
```javascript
// Get profile info
const getProfile = async () => {
  try {
    const response = await fetch('http://localhost:5000/instagram/profile');
    const data = await response.json();
    
    if (data.success) {
      console.log('Profile:', data.data);
      // Use profile data in your UI
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

// Get recent posts
const getPosts = async (limit = 10) => {
  try {
    const response = await fetch(`http://localhost:5000/instagram/posts?limit=${limit}`);
    const data = await response.json();
    
    if (data.success) {
      console.log('Posts:', data.data.posts);
      // Display posts in your UI
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### React Hook Example
```javascript
import { useState, useEffect } from 'react';

const useInstagramData = () => {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch profile and posts in parallel
        const [profileRes, postsRes] = await Promise.all([
          fetch('http://localhost:5000/instagram/profile'),
          fetch('http://localhost:5000/instagram/posts?limit=12')
        ]);

        const profileData = await profileRes.json();
        const postsData = await postsRes.json();

        if (profileData.success) setProfile(profileData.data);
        if (postsData.success) setPosts(postsData.data.posts);
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { profile, posts, loading, error };
};
```

## 🔒 Security Best Practices

### 1. Environment Variables
- **Never** commit your `.env` file to version control
- Use different tokens for development/staging/production
- Rotate your access tokens regularly (before 60-day expiry)

### 2. Error Handling
- All endpoints return consistent error formats
- Check `success` field before using `data`
- Handle network errors and API rate limits

### 3. Rate Limiting
- Instagram Graph API has rate limits
- Implement caching for frequently accessed data
- Consider using webhooks for real-time updates

## 🛠️ Troubleshooting

### Common Issues

#### 1. "Instagram credentials not configured"
**Solution:** Ensure `IG_ACCESS_TOKEN` and `IG_USER_ID` are set in your `.env` file

#### 2. "Instagram access token is invalid or expired"
**Solutions:**
- Generate a new long-lived access token
- Check if your Instagram Business Account is still connected to Facebook Page
- Verify token permissions include required scopes

#### 3. "Failed to fetch Instagram profile/posts"
**Solutions:**
- Check your internet connection
- Verify Instagram User ID is correct
- Ensure your Instagram account is a Business account
- Check Facebook Developer Console for app status

#### 4. Empty posts array
**Solutions:**
- Ensure your Instagram Business Account has published posts
- Check if posts are public (not private)
- Verify account permissions

### Debug Mode
Enable debug logging by checking the console output. All API requests and responses are logged with emojis for easy identification:

```
📱 Instagram Graph API: GET /instagram/profile
📡 Instagram API Request: https://graph.instagram.com/17841400455970028?fields=...
✅ Instagram API Success: /17841400455970028
```

## 📝 File Structure

```
src/
├── services/
│   └── instagramGraphService.js    # Core Instagram Graph API logic
├── controllers/
│   └── instagramGraphController.js # HTTP request/response handling
└── routes/
    └── instagramGraph.js          # API route definitions
```

## 🔄 Token Refresh

Long-lived tokens expire after 60 days. Set up a reminder to refresh them:

1. Use Facebook Graph API Explorer
2. Generate new long-lived token
3. Update `IG_ACCESS_TOKEN` in your environment
4. Restart your application

## 📊 Monitoring

Monitor your integration with:
- Health check endpoint: `/instagram/health`
- Token validation: `/instagram/validate`
- Error logs in console output
- Instagram API usage in Facebook Developer Console

---

## 🎉 You're Ready!

Your Instagram Graph API integration is now production-ready with:
- ✅ Secure token storage
- ✅ Clean API endpoints
- ✅ Comprehensive error handling
- ✅ Frontend-friendly responses
- ✅ Production best practices

Start building amazing Instagram features in your Reply Rush application!
