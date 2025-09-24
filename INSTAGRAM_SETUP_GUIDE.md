# Instagram Basic Display API Setup Guide

## The Problem
You're getting "Invalid platform app" error because you're using a Facebook app ID (`793816953052613`) instead of a proper Instagram Basic Display app ID.

## Solution: Create Instagram Basic Display App

### Step 1: Go to Meta Developer Console
1. Visit https://developers.facebook.com/
2. Log in with your Facebook account
3. Click "My Apps" in the top menu

### Step 2: Create New App
1. Click "Create App"
2. Select "Consumer" as the app type
3. Fill in app details:
   - App Name: "Reply Rush Instagram"
   - App Contact Email: your email
4. Click "Create App"

### Step 3: Add Instagram Basic Display Product
1. In your app dashboard, scroll down to "Add Products to Your App"
2. Find "Instagram Basic Display" and click "Set Up"
3. Click "Create New App" if prompted

### Step 4: Configure Instagram Basic Display
1. Go to Instagram Basic Display > Basic Display
2. Click "Create New App"
3. Fill in the details:
   - Display Name: "Reply Rush"
   - Description: "Social media management tool"
   - Privacy Policy URL: (your privacy policy URL)
   - Terms of Service URL: (your terms URL)

### Step 5: Get Your Credentials
1. In Instagram Basic Display > Basic Display
2. Copy your "Instagram App ID" (this is your INSTAGRAM_CLIENT_ID)
3. Copy your "Instagram App Secret" (this is your INSTAGRAM_CLIENT_SECRET)

### Step 6: Configure OAuth Redirect URIs
1. In Instagram Basic Display > Basic Display
2. Under "Valid OAuth Redirect URIs", add:
   ```
   https://c43510a0f5c7.ngrok-free.app/auth/instagram/callback
   http://localhost:5000/auth/instagram/callback
   ```
3. Save changes

### Step 7: Add Test Users
1. Go to Instagram Basic Display > Roles > Roles
2. Click "Add Instagram Testers"
3. Add your Instagram username
4. Accept the invitation in your Instagram app

### Step 8: Update Your .env File
Replace the values in your `.env` file:
```env
INSTAGRAM_CLIENT_ID=your_actual_INSTAGRAM_CLIENT_ID_here
INSTAGRAM_CLIENT_SECRET=your_actual_INSTAGRAM_CLIENT_SECRET_here
```

## Important Notes
- The Instagram Basic Display API only works with personal Instagram accounts
- You need to add Instagram accounts as "testers" during development
- For production, you'll need to submit your app for review
- The current Facebook app ID (793816953052613) won't work with Instagram Basic Display API

## Testing
After setting up the proper credentials:
1. Restart your backend server
2. Try connecting Instagram again
3. The OAuth flow should now work properly
