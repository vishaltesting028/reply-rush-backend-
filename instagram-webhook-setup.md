# Instagram Webhook Setup Guide

## Environment Variables

Add these to your `.env` file:

```env
# Instagram Webhook Configuration
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=my_secret_token
INSTAGRAM_CLIENT_SECRET=your_INSTAGRAM_CLIENT_SECRET_here

# Note: Use the same token you configure in Facebook Developer Console
```

## Webhook Endpoints

Your server now provides these Instagram webhook endpoints:

### 1. Webhook Verification (GET)
```
GET /webhook/instagram
```
- Used by Facebook/Instagram to verify your webhook endpoint
- Responds with challenge parameter if verification token matches

### 2. Webhook Events (POST)
```
POST /webhook/instagram
```
- Receives real-time events from Instagram
- Processes comments, mentions, story insights, and media updates
- Includes signature verification for security

### 3. Test Endpoint (POST)
```
POST /webhook/instagram/test
```
- For development testing
- Accepts custom webhook payloads

### 4. Info Endpoint (GET)
```
GET /webhook/instagram/info
```
- Returns webhook configuration status
- Shows supported events and setup instructions

## Facebook Developer Console Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Select your app
3. Go to **Products** → **Webhooks**
4. Click **Add Subscription** for Instagram
5. Configure:
   - **Callback URL**: `https://yourdomain.com/webhook/instagram`
   - **Verify Token**: `my_secret_token` (same as in .env)
   - **Fields**: Select events you want to receive:
     - `comments` - New comments on posts
     - `live_comments` - Live video comments
     - `mentions` - When your account is mentioned
     - `story_insights` - Story performance metrics

## Supported Webhook Events

The webhook handler processes these Instagram events:

### Comments
```json
{
  "object": "instagram",
  "entry": [{
    "id": "instagram_user_id",
    "changes": [{
      "field": "comments",
      "value": {
        "comment_id": "comment_id",
        "media_id": "media_id",
        "text": "Comment text"
      }
    }]
  }]
}
```

### Mentions
```json
{
  "object": "instagram", 
  "entry": [{
    "id": "instagram_user_id",
    "changes": [{
      "field": "mentions",
      "value": {
        "comment_id": "comment_id", // if mentioned in comment
        "media_id": "media_id"      // if mentioned in caption
      }
    }]
  }]
}
```

### Story Insights
```json
{
  "object": "instagram",
  "entry": [{
    "id": "instagram_user_id", 
    "changes": [{
      "field": "story_insights",
      "value": {
        "media_id": "story_media_id",
        "exits": 10,
        "replies": 5,
        "reach": 100,
        "taps_forward": 20,
        "taps_back": 3,
        "impressions": 150
      }
    }]
  }]
}
```

## Security Features

✅ **Signature Verification**
- Validates webhook requests using HMAC-SHA256
- Prevents unauthorized webhook calls
- Uses `INSTAGRAM_CLIENT_SECRET` for verification

✅ **Token Verification**
- Verifies webhook subscription with verify token
- Prevents unauthorized webhook setup

✅ **Error Handling**
- Graceful error handling for failed events
- Returns 200 status to prevent Instagram retries
- Comprehensive logging for debugging

## Testing Your Webhook

### 1. Verify Endpoint
```bash
curl "https://yourdomain.com/webhook/instagram?hub.mode=subscribe&hub.verify_token=my_secret_token&hub.challenge=test_challenge"
```
Expected response: `test_challenge`

### 2. Test Event Processing
```bash
curl -X POST https://yourdomain.com/webhook/instagram/test \
  -H "Content-Type: application/json" \
  -d '{
    "object": "instagram",
    "entry": [{
      "id": "test_user_id",
      "changes": [{
        "field": "comments",
        "value": {
          "comment_id": "test_comment",
          "media_id": "test_media",
          "text": "Test comment"
        }
      }]
    }]
  }'
```

### 3. Check Configuration
```bash
curl https://yourdomain.com/webhook/instagram/info
```

## Integration with Reply Rush

The webhook automatically:

1. **Stores Events** - Saves comments, mentions, and insights to user database
2. **Auto-Responds** - Sends automatic replies if configured
3. **Syncs Media** - Updates media data when posts are modified
4. **Processes Insights** - Stores story performance metrics
5. **Handles Mentions** - Responds to account mentions

## Troubleshooting

### Common Issues

1. **Verification Failed**
   - Check `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` matches Facebook console
   - Ensure endpoint is publicly accessible

2. **Signature Validation Failed**
   - Verify `INSTAGRAM_CLIENT_SECRET` is correct
   - Check request body is not modified by middleware

3. **Events Not Processing**
   - Check server logs for errors
   - Verify user has Instagram account connected
   - Ensure access tokens are valid

### Debug Logs

The webhook provides detailed logging:
- ✅ Successful operations
- ❌ Errors with details
- ⚠️ Warnings for missing data
- 📥 Incoming webhook events
- 🧪 Test events

## Production Considerations

1. **HTTPS Required** - Instagram webhooks require HTTPS endpoints
2. **Response Time** - Respond within 20 seconds to avoid timeouts
3. **Rate Limiting** - Handle high-volume events efficiently
4. **Monitoring** - Monitor webhook health and error rates
5. **Backup Processing** - Handle failed events gracefully
