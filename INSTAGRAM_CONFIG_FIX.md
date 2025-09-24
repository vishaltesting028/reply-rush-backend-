# Instagram OAuth Configuration Fix Guide

## Issues Fixed

### 1. API Consistency Issues ✅
- **Fixed**: Mixed Facebook/Instagram API references in `instagramDirectOAuth.js`
- **Updated**: All variable names to use `INSTAGRAM_CLIENT_ID` and `INSTAGRAM_CLIENT_SECRET`
- **Corrected**: Console log messages and error messages to reference Instagram instead of Facebook

### 2. Frontend Route Update ✅
- **Changed**: Frontend now calls `/auth/instagram-direct` instead of `/auth/instagram`
- **Reason**: The `instagramDirectOAuth.js` implementation is more consistent and reliable

### 3. Backend Route Integration ✅
- **Added**: `instagramDirectOAuth` route to server.js
- **Available Routes**: Both old and new OAuth implementations are available for testing

## Required Configuration Steps

### Step 1: Create Instagram Basic Display App
You need to create a proper Instagram Basic Display app in Meta Developer Console:

1. Go to https://developers.facebook.com/
2. Create a new app with type "Consumer"
3. Add "Instagram Basic Display" product
4. Configure OAuth redirect URIs:
   ```
     https://5ece8457d962.ngrok-free.app/auth/instagram-direct/callback
   http://localhost:5000/auth/instagram-direct/callback
   ```

### Step 2: Update Environment Variables
Create/update your `.env` file with these values:

```env
# Instagram Basic Display API Configuration
INSTAGRAM_CLIENT_ID=your_new_instagram_basic_display_app_id
INSTAGRAM_CLIENT_SECRET=your_new_instagram_basic_display_app_secret
INSTAGRAM_REDIRECT_URI=  https://5ece8457d962.ngrok-free.app/auth/instagram-direct/callback

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/ReplyRushh
```

### Step 3: Add Test Users
In Meta Developer Console:
1. Go to Instagram Basic Display > Roles
2. Add your Instagram account as a tester
3. Accept the invitation in your Instagram app

### Step 4: Test the Flow
1. Restart your backend server
2. Go to your frontend connect account page
3. Click "Connect with Instagram"
4. Should now redirect to Instagram (not Facebook)

## Current Implementation Status

### ✅ What's Working:
- Frontend connect button
- Backend OAuth initiation (`/auth/instagram-direct`)
- OAuth callback handling (`/auth/instagram-direct/callback`)
- Database user model with Instagram schema
- Status checking (`/api/instagram/status`)
- Token exchange (short-lived to long-lived)
- User profile fetching via Instagram Basic Display API

### ⚠️ What Needs Configuration:
- Instagram Basic Display app credentials
- Environment variables setup
- Test user addition in Meta Developer Console

### 🔄 API Flow:
1. **Frontend**: Redirects to `/auth/instagram-direct`
2. **Backend**: Redirects to `https://api.instagram.com/oauth/authorize`
3. **Instagram**: User authorizes app
4. **Callback**: `/auth/instagram-direct/callback` processes the response
5. **Token Exchange**: Gets long-lived access token
6. **Profile Fetch**: Gets user data via `https://graph.instagram.com/me`
7. **Database**: Saves user data with `isConnected: true`
8. **Frontend**: Updates UI to show connected account

## Troubleshooting

### If you get "Invalid platform app" error:
- You're using a Facebook app ID instead of Instagram Basic Display app ID
- Create a new Instagram Basic Display app as described above

### If you get "Invalid redirect URI" error:
- Make sure your redirect URI in Meta Developer Console matches exactly:
  `  https://5ece8457d962.ngrok-free.app/auth/instagram-direct/callback`

### If OAuth completes but `isConnected` is false:
- Check backend logs for API errors
- Verify your Instagram Client Secret is correct
- Make sure your Instagram account is added as a tester

## Next Steps
1. Create Instagram Basic Display app
2. Update .env file with new credentials
3. Add your Instagram account as tester
4. Test the complete OAuth flow
