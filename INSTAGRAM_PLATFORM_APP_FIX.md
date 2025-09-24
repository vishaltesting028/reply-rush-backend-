# Fix: "Invalid platform app" Error

## 🚨 Problem
You're getting the error: **"Invalid request: Request parameters are invalid: Invalid platform app"**

This error occurs when there's a mismatch between your app configuration and the Instagram Graph API requirements.

## 🔍 Root Cause Analysis

The error typically happens because:

1. **Wrong App Type**: Using a Facebook app instead of Instagram Business API app
2. **Missing Instagram Business API Product**: App doesn't have Instagram Business API enabled
3. **Incorrect Access Token**: Using Basic Display API token for Graph API calls
4. **Account Type Mismatch**: Personal account instead of Business account

## ✅ Solution Steps

### Step 1: Verify Your App Configuration

Go to [Facebook Developers Console](https://developers.facebook.com/) and check:

1. **App Type**: Should be "Business" (not Consumer)
2. **Products Added**: Must include "Instagram Graph API" or "Instagram Basic Display"
3. **App Review**: Some features require app review

### Step 2: Check Your Instagram Account Type

Your Instagram account MUST be:
- ✅ **Business Account** (not Personal)
- ✅ **Connected to a Facebook Page**
- ✅ **Page must be published** (not unpublished)

### Step 3: Get Correct Credentials

#### For Instagram Graph API (Recommended for Business features):
```bash
# Use these endpoints to get your credentials:
# 1. Get Page Access Token from Facebook Page
# 2. Get Instagram Business Account ID connected to that page
# 3. Use Page Access Token (not User Access Token)
```

#### For Instagram Basic Display API (Limited features):
```bash
# Only for basic profile and media access
# Cannot post content or get insights
```

## 🛠️ Quick Fix Implementation

I've created multiple solutions for you:

### Option 1: Use Universal Service (Recommended)
The universal service automatically detects your token type and uses the appropriate API:

```bash
# Test the universal endpoints:
curl http://localhost:5000/instagram-universal/status
curl http://localhost:5000/instagram-universal/profile
curl http://localhost:5000/instagram-universal/posts
```

### Option 2: Run Diagnostic Tool
```bash
node diagnose-instagram-issue.js
```

This will analyze your tokens and provide specific recommendations.

### Option 3: Switch to Instagram Basic Display API
If you're having issues with Graph API, you can use Basic Display API:

1. **Create Instagram Basic Display App** (not Facebook app)
2. **Set INSTAGRAM_ACCESS_TOKEN** in your .env file
3. **Use universal endpoints** which will automatically use Basic Display API

## 🔧 Immediate Solutions

### Solution A: Fix Your Current Setup
1. **Check App Type**: Go to Facebook Developers → Your App → Settings → Basic
   - App Type should be "Business" for Graph API
   - Or "Consumer" for Basic Display API

2. **Add Correct Product**:
   - For Graph API: Add "Instagram Graph API" product
   - For Basic Display: Add "Instagram Basic Display" product

3. **Get Correct Token**:
   - Graph API: Need **Page Access Token** (not User Access Token)
   - Basic Display: Need **User Access Token**

### Solution B: Use What You Have
If you already have a working Instagram Basic Display token:

```bash
# In your .env file:
INSTAGRAM_ACCESS_TOKEN=your_existing_token_here
# Remove or comment out IG_ACCESS_TOKEN and IG_USER_ID
```

Then use these endpoints:
- `GET /instagram-universal/profile`
- `GET /instagram-universal/posts`

### Solution C: Get New Credentials
1. **For Instagram Graph API** (Business features):
   - Create Facebook Business App
   - Add Instagram Graph API product
   - Connect Instagram Business Account to Facebook Page
   - Get Page Access Token
   - Set `IG_ACCESS_TOKEN` and `IG_USER_ID`

2. **For Instagram Basic Display API** (Basic features):
   - Create Instagram Basic Display App
   - Get User Access Token
   - Set `INSTAGRAM_ACCESS_TOKEN`

## 🧪 Test Your Fix

After implementing any solution:

```bash
# Test universal service
node -e "
const service = require('./src/services/instagramUniversalService');
const inst = new service();
console.log('Status:', inst.getStatus());
"

# Or test endpoints
curl http://localhost:5000/instagram-universal/status
```

## 📋 Quick Checklist

- [ ] App type is correct (Business for Graph API, Consumer for Basic Display)
- [ ] Correct product added to your app
- [ ] Instagram account is Business account (for Graph API) or Personal (for Basic Display)
- [ ] Token type matches API type (Page token for Graph API, User token for Basic Display)
- [ ] Environment variables are set correctly
- [ ] Using correct endpoints for your setup

## 🆘 Still Having Issues?

Run the diagnostic tool:
```bash
node diagnose-instagram-issue.js
```

This will tell you exactly what's wrong and how to fix it.
