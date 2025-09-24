# Instagram OAuth Debug Checklist

## Current Error: "Invalid platform app"

The error persists because there are specific requirements for Instagram Basic Display API that must be met exactly.

## Critical Checks:

### 1. App Type Verification
- Go to https://developers.facebook.com/apps/793816953052613/
- Verify this is an **Instagram Basic Display** app, NOT a Facebook Login app
- Check that "Instagram Basic Display" product is added and configured

### 2. App Status
- App must be in "Development" mode initially
- For production, app needs Instagram review approval
- Check app status in Meta Developer Console

### 3. Redirect URI Configuration
**CRITICAL**: The redirect URI must match EXACTLY (case-sensitive, no trailing slashes)

In your Instagram Basic Display settings:
- Valid OAuth Redirect URIs must include: `https://50db5a34664f.ngrok-free.app/auth/instagram/callback`
- NO trailing slash
- HTTPS required
- Must match your .env file exactly

### 4. Test Users
- Your Instagram account must be added as a "Test User"
- Go to Instagram Basic Display > Roles > Roles
- Add your Instagram username as "Instagram Tester"
- Accept the invitation in your Instagram app

### 5. App Review Status
- Personal accounts work in Development mode
- Business accounts may need app review
- Check if your Instagram account type matches app requirements

## Quick Fix Steps:

1. **Verify App Type**:
   ```
   https://developers.facebook.com/apps/793816953052613/instagram-basic-display/basic-display/
   ```

2. **Check Redirect URI**:
   - Must be: `https://50db5a34664f.ngrok-free.app/auth/instagram/callback`
   - Save changes after adding

3. **Add Test User**:
   - Go to Roles section
   - Add your Instagram username
   - Accept invitation

4. **Test with Different Account**:
   - Try with a different Instagram account
   - Ensure it's added as test user

## Common Issues:
- Using Facebook app instead of Instagram Basic Display app
- Redirect URI mismatch (trailing slash, http vs https)
- Instagram account not added as test user
- App not in correct mode (Development vs Live)

## Verification URL:
Check your app configuration at:
https://developers.facebook.com/apps/793816953052613/instagram-basic-display/basic-display/
