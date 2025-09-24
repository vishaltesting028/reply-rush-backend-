# Instagram App Setup Guide

## Step 1: Create Facebook Developer App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Select "Consumer" app type
4. Fill in app details:
   - App Name: "ReplyRush Instagram"
   - App Contact Email: your email

## Step 2: Add Instagram Basic Display

1. In your app dashboard, click "Add Product"
2. Find "Instagram Basic Display" and click "Set Up"
3. Click "Create New App" if prompted

## Step 3: Configure Instagram Basic Display

1. Go to Instagram Basic Display → Basic Display
2. Add Instagram Test User:
   - Click "Add or Remove Instagram Testers"
   - Add your Instagram username
   - Accept the invitation on Instagram app

## Step 4: Configure OAuth Redirect URIs

1. In Instagram Basic Display settings
2. Add Valid OAuth Redirect URIs:
   ```
   http://localhost:3000/auth/instagram/callback
   http://localhost:5000/api/instagram/oauth/instagram/callback
   ```

## Step 5: Get Your Credentials

1. Copy your Instagram App ID
2. Copy your Instagram App Secret
3. Generate User Token:
   - Go to User Token Generator
   - Select your test user
   - Generate token with scopes: user_profile, user_media

## Step 6: Update .env File

Replace the values in your .env file:

```env
INSTAGRAM_CLIENT_ID=your_app_id_here
INSTAGRAM_CLIENT_SECRET=your_app_secret_here
INSTAGRAM_ACCESS_TOKEN=your_generated_user_token_here
```

## Step 7: Test Connection

Run: `npm run dev`

Your Instagram connection should now work!

## Troubleshooting

- Make sure Instagram account is added as test user
- Verify redirect URIs match exactly
- Check that tokens haven't expired
- Ensure app is in development mode
