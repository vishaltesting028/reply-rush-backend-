# Instagram OAuth Integration - Updated Setup

## Overview
Your Instagram OAuth integration has been updated to use the exact URL format you specified, with Instagram Business API integration and proper callback handling.

## Changes Made

### 1. Backend Updates (`src/routes/instagram.js`)

#### OAuth URL Generation
- **Client ID**: Updated to `1517180355553139`
- **Redirect URI**: Changed to `https://app.replyrush.com/auth/sign-in/`
- **Scopes**: Updated to Instagram Business scopes:
  - `instagram_business_basic`
  - `instagram_business_manage_messages`
  - `instagram_business_manage_comments`
  - `instagram_business_manage_insights`
- **URL Format**: Matches your exact specification with nested login/reels/oauth structure

#### API Integration
- **Primary**: Instagram Business API for enhanced features
- **Fallback**: Instagram Basic Display API for compatibility
- **Features**: Real engagement metrics (likes, comments) when using Business API

### 2. Server Configuration (`server.js`)

#### New Routes Added
```javascript
// Handles the new production redirect URI
app.get('/auth/sign-in/', (req, res) => {
  req.url = '/callback';
  instagramRoutes(req, res);
});
```

### 3. Frontend Updates (`src/components/InstagramOAuthModal.tsx`)

#### Message Handling
- Updated to accept messages from production domains
- Added support for ngrok and app.replyrush.com origins
- No UI changes - interface remains exactly the same

## Expected OAuth Flow

1. **User clicks "Connect Instagram"**
2. **Popup opens with URL**:
   ```
   https://www.instagram.com/accounts/login/?next=https%3A%2F%2Fwww.instagram.com%2Freels%2FDMD2FSaNEWW%2F%3Fnext%3Dhttps%253A%252F%252Fwww.instagram.com%252Foauth%252Fauthorize%252Fthird_party%252F%253Fredirect_uri%253Dhttps%25253A%25252F%25252Fapp.replyrush.com%25252Fauth%25252Fsign-in%25252F%2526response_type%253Dcode%2526scope%253Dinstagram_business_basic%25252Cinstagram_business_manage_messages%25252Cinstagram_business_manage_comments%25252Cinstagram_business_manage_insights%2526client_id%253D1517180355553139%2526force_reauth%253D0%2526logger_id%253Dcec3cc19-cf84-42a8-9139-acc2e9808310%26__coig_login%3D1#
   ```
3. **User completes Instagram login**
4. **Instagram redirects to your callback**
5. **Backend processes OAuth and saves user data**
6. **Popup closes and main window updates**

## Testing

### Automated Test
```bash
node test-instagram-oauth.js
```

### Manual Testing Steps
1. Start your backend server
2. Open your frontend application
3. Click the "Connect Instagram" button
4. Verify the popup opens with the correct Instagram login URL
5. Complete Instagram OAuth flow
6. Check if the connection is successful

### URL Validation Checklist
- ✅ Starts with `https://www.instagram.com/accounts/login/`
- ✅ Contains client ID `1517180355553139`
- ✅ Includes Instagram Business scopes
- ✅ Redirects to `https://app.replyrush.com/auth/sign-in/`

## Environment Variables

Make sure your `.env` file has the correct Instagram client secret:
```env
INSTAGRAM_CLIENT_SECRET=9bcbffc0fa8c80b67edd6bf8df403e3b
```

## API Endpoints

### Available Routes
- `GET /api/instagram/auth` - Get OAuth authorization URL
- `GET /api/instagram/status` - Check connection status
- `GET /api/instagram/posts` - Fetch Instagram posts
- `POST /api/instagram/connect` - Connect Instagram account
- `POST /api/instagram/disconnect` - Disconnect Instagram account

### Callback Routes
- `GET /auth/sign-in/` - Production callback handler
- `GET /api/instagram/callback` - Alternative callback handler

## Troubleshooting

### Common Issues
1. **Invalid platform app error**: Fixed by using correct client ID and Business API
2. **Callback not working**: Ensured proper route handling for production redirect URI
3. **Popup blocked**: Frontend handles popup communication correctly

### Debug Information
- Check browser console for popup communication
- Check server logs for OAuth callback processing
- Verify environment variables are loaded correctly

## Next Steps

1. Test the OAuth flow in your development environment
2. Deploy to production with the updated configuration
3. Verify the Instagram Business API integration works correctly
4. Monitor for any OAuth-related errors in production logs

The integration is now ready to use with your Instagram Business account!
