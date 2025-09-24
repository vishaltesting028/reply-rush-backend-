# Passport.js Facebook Authentication Setup

## Required Dependencies

Add these packages to your project:

```bash
npm install passport passport-facebook express-session connect-mongo
```

## Package.json Dependencies

Add these to your `package.json` dependencies:

```json
{
  "dependencies": {
    "passport": "^0.6.0",
    "passport-facebook": "^3.0.0",
    "express-session": "^1.17.3",
    "connect-mongo": "^5.0.0"
  }
}
```

## Environment Variables

Add these to your `.env` file:

```env
# Facebook App Configuration
FACEBOOK_APP_ID=your_facebook_app_id_here
FACEBOOK_APP_SECRET=your_facebook_app_secret_here
FACEBOOK_CALLBACK_URL=https://yourdomain.com/auth/facebook/callback

# Session Configuration
SESSION_SECRET=your_secure_session_secret_here

# Frontend URL
FRONTEND_URL=https://yourdomain.com
```

## Facebook App Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or select existing app
3. Add "Facebook Login" product
4. Configure OAuth redirect URIs:
   - `https://yourdomain.com/auth/facebook/callback`
5. Add required permissions:
   - `email`
   - `public_profile`
   - `pages_read_engagement`
   - `pages_manage_posts`
   - `instagram_basic`
   - `instagram_content_publish`

## Available Endpoints

### Authentication Routes
- `GET /auth/facebook` - Redirect to Facebook OAuth
- `GET /auth/facebook/callback` - Facebook OAuth callback
- `GET /auth/user` - Get current authenticated user
- `GET /auth/status` - Check authentication status
- `POST /auth/logout` - Logout user

### Usage Examples

#### Frontend Integration (JavaScript)
```javascript
// Redirect to Facebook OAuth
window.location.href = '/auth/facebook';

// Check authentication status
fetch('/auth/status')
  .then(res => res.json())
  .then(data => {
    if (data.isAuthenticated) {
      console.log('User is logged in:', data.user);
    }
  });

// Logout
fetch('/auth/logout', { method: 'POST' })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      window.location.reload();
    }
  });
```

## Features

✅ **Automatic User Creation/Linking**
- Creates new users from Facebook profiles
- Links Facebook accounts to existing email matches
- Stores Facebook profile data (name, email, picture)

✅ **Instagram Business Account Auto-Detection**
- Automatically detects Instagram Business Accounts
- Connects Instagram during Facebook OAuth flow
- Syncs Instagram data immediately

✅ **Session Management**
- Secure session storage in MongoDB
- 7-day session expiry
- CSRF protection

✅ **User Data Storage**
- Facebook profile information
- Instagram Business Account data
- Access tokens for API calls
- Connection timestamps

## Security Notes

- Sessions are stored in MongoDB using `connect-mongo`
- Cookies are HTTP-only and secure in production
- CSRF protection enabled
- Rate limiting applied to auth endpoints
- Passwords are bcrypt hashed for OAuth users

## Testing

1. Start your server
2. Navigate to `/auth/facebook`
3. Complete Facebook OAuth flow
4. Check `/auth/user` endpoint for user data
5. Verify Instagram auto-connection if Business Account exists
