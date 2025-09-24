# Instagram Content Publishing API Documentation

## Overview
The Instagram Content Publishing API allows you to upload photos, carousels, videos, and stories to Instagram through your ReplyRush backend. This functionality uses the Instagram Content Publishing API and requires an Instagram Business Account.

## Prerequisites

### 1. Instagram Business Account
- Your Instagram account must be converted to a Business Account
- The Business Account must be connected to a Facebook Page
- You need the `instagram_content_publish` permission

### 2. OAuth Scopes
The following scopes are required for content publishing:
```
user_profile,user_media,instagram_content_publish
```

### 3. Environment Variables
Ensure your `.env` file contains:
```env
INSTAGRAM_CLIENT_ID=your_client_id
INSTAGRAM_CLIENT_SECRET=your_client_secret
INSTAGRAM_REDIRECT_URI=your_redirect_uri
```

## API Endpoints

### 1. Upload Single Photo
**POST** `/api/instagram/upload/photo`

Upload a single photo to Instagram.

**Request Body:**
```json
{
  "imageUrl": "https://example.com/image.jpg",
  "caption": "Your photo caption with #hashtags"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Photo uploaded successfully to Instagram",
  "data": {
    "mediaId": "instagram_media_id",
    "containerId": "container_id"
  }
}
```

### 2. Upload Carousel
**POST** `/api/instagram/upload/carousel`

Upload multiple photos as a carousel post (2-10 images).

**Request Body:**
```json
{
  "imageUrls": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg",
    "https://example.com/image3.jpg"
  ],
  "caption": "Your carousel caption with #hashtags"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Carousel uploaded successfully to Instagram",
  "data": {
    "mediaId": "instagram_media_id",
    "containerId": "container_id",
    "itemCount": 3
  }
}
```

### 3. Upload Video
**POST** `/api/instagram/upload/video`

Upload a video to Instagram.

**Request Body:**
```json
{
  "videoUrl": "https://example.com/video.mp4",
  "caption": "Your video caption with #hashtags",
  "thumbnailUrl": "https://example.com/thumbnail.jpg" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Video uploaded successfully to Instagram",
  "data": {
    "mediaId": "instagram_media_id",
    "containerId": "container_id"
  }
}
```

### 4. Upload Story
**POST** `/api/instagram/upload/story`

Upload an image or video as an Instagram Story.

**Request Body:**
```json
{
  "mediaUrl": "https://example.com/story.jpg",
  "mediaType": "IMAGE" // or "VIDEO"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Story uploaded successfully to Instagram",
  "data": {
    "mediaId": "instagram_media_id",
    "containerId": "container_id"
  }
}
```

### 5. Check Upload Status
**GET** `/api/instagram/upload/status/:containerId`

Check the status of a media upload (useful for videos that need processing time).

**Response:**
```json
{
  "success": true,
  "data": {
    "status_code": "FINISHED", // or "IN_PROGRESS", "ERROR"
    "status": "Media container is ready for publishing"
  }
}
```

## Error Responses

All endpoints return error responses in the following format:

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE" // Optional Instagram API error code
}
```

### Common Error Codes
- `100`: Invalid parameter
- `190`: Access token expired or invalid
- `200`: Permission denied
- `368`: The action attempted has been deemed abusive or is otherwise disallowed

## Usage Examples

### JavaScript/Node.js Example
```javascript
const axios = require('axios');

// Upload a single photo
async function uploadPhoto() {
  try {
    const response = await axios.post('http://localhost:5000/api/instagram/upload/photo', {
      imageUrl: 'https://picsum.photos/1080/1080',
      caption: 'Beautiful sunset 🌅 #nature #photography'
    });
    
    console.log('Upload successful:', response.data);
  } catch (error) {
    console.error('Upload failed:', error.response.data);
  }
}
```

### cURL Example
```bash
# Upload a photo
curl -X POST http://localhost:5000/api/instagram/upload/photo \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://picsum.photos/1080/1080",
    "caption": "Test upload from API 📸 #test"
  }'
```

### Python Example
```python
import requests

def upload_photo():
    url = "http://localhost:5000/api/instagram/upload/photo"
    data = {
        "imageUrl": "https://picsum.photos/1080/1080",
        "caption": "Python API test 🐍 #python #api"
    }
    
    response = requests.post(url, json=data)
    
    if response.status_code == 200:
        print("Upload successful:", response.json())
    else:
        print("Upload failed:", response.json())
```

## Testing

### Run All Tests
```bash
node test-instagram-upload.js
```

### Test Specific Endpoints
```bash
# Test photo upload
node test-instagram-upload.js photo

# Test carousel upload
node test-instagram-upload.js carousel

# Test video upload
node test-instagram-upload.js video

# Test story upload
node test-instagram-upload.js story
```

## Media Requirements

### Images
- **Format**: JPEG, PNG
- **Size**: Minimum 320px, Maximum 8192px
- **Aspect Ratio**: Between 4:5 and 1.91:1
- **File Size**: Maximum 8MB

### Videos
- **Format**: MP4, MOV
- **Duration**: 3 seconds to 60 seconds (feed), up to 15 seconds (stories)
- **Size**: Maximum 100MB
- **Resolution**: Minimum 720p

### Stories
- **Images**: 1080x1920px recommended
- **Videos**: 1080x1920px, 15 seconds maximum
- **Format**: JPEG, PNG for images; MP4 for videos

## Rate Limits

Instagram API has rate limits:
- **Per User**: 200 calls per hour
- **Per App**: 4800 calls per hour per app user

## Troubleshooting

### Common Issues

1. **"Instagram account not connected"**
   - Ensure you've completed the OAuth flow
   - Check that `isConnected` is true in `/api/instagram/status`

2. **"No Instagram Business Account found"**
   - Convert your Instagram account to Business
   - Connect it to a Facebook Page
   - Ensure proper permissions are granted

3. **"Invalid media URL"**
   - URLs must be publicly accessible
   - Use HTTPS URLs only
   - Ensure the media meets Instagram's requirements

4. **"Permission denied"**
   - Check that `instagram_content_publish` scope is included
   - Re-authenticate if necessary

### Debug Steps
1. Check Instagram connection status: `GET /api/instagram/status`
2. Verify OAuth scopes include `instagram_content_publish`
3. Test with publicly accessible media URLs
4. Check server logs for detailed error messages

## Security Considerations

1. **Access Tokens**: Store securely and refresh when needed
2. **Media URLs**: Ensure URLs are from trusted sources
3. **Rate Limiting**: Implement proper rate limiting in your application
4. **Content Validation**: Validate media before uploading

## Support

For issues related to:
- **Instagram API**: Check [Instagram API Documentation](https://developers.facebook.com/docs/instagram-api)
- **ReplyRush Backend**: Check server logs and test endpoints
- **OAuth Flow**: Verify redirect URIs and app configuration
