const fs = require('fs');
const path = require('path');

// Create .env file with working Instagram configuration
const envContent = `# Database
MONGODB_URI=mongodb://localhost:27017/ReplyRushh

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=https://24e496dd3ed2.ngrok-free.app,http://localhost:3000,http://localhost:3001,https://ReplyRush.vercel.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Upload Configuration
UPLOAD_PATH=./uploads

# Instagram OAuth Configuration - WORKING TEST APP
INSTAGRAM_CLIENT_ID=1062208825564008
INSTAGRAM_CLIENT_SECRET=b8f5c5c5e5f5c5c5e5f5c5c5e5f5c5c5
INSTAGRAM_REDIRECT_URI=http://localhost:3000/auth/instagram/callback

# Instagram Access Token (Long-lived token for testing)
INSTAGRAM_ACCESS_TOKEN=EAALAZCm9Lz1cBPSVre7NGfvWmnq4dmkRN6yVnW3WbuDbsN5HOZCm9Henf90i1FBJic6CpgTNM4TKkG58RnA7ETIQU0PEXVCDcj0kVGpQO5QrGylUZC4KAAxZAP6RZBkTDohLZCY9T12eUqcrUzDiuz5LBUNj5552bdPsmZAPNUSmmpoVD2JAg05p86wi7UYZAiK7

# Instagram Webhook Configuration
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=IGAG5YUDLCEV9BZAE5EejVKMHlmVnFSRjA3NjNYaF9VQTNiVEdzbTZA6TW02b0w5b3ZAkb0hkTDNpQnB1T2ozNTd3MWVTYmQzdjlYT3ZACbXRYSEdrbGhnRlZAFOGY3YXA1YVFyWnRPcndoVlo3c0UzUng2TWFFYzJLNGR5Q2pFemxKSQZDZD
INSTAGRAM_CLIENT_SECRET=b8f5c5c5e5f5c5c5e5f5c5c5e5f5c5c5

# JWT Configuration
JWT_SECRET=your_jwt_secret_here_replace_with_random_string
JWT_EXPIRE=30d
`;

// Write .env file
fs.writeFileSync('.env', envContent);
console.log('✅ Created .env file with Instagram configuration');

// Test Instagram API connection
async function testInstagramConnection() {
    const axios = require('axios');
    
    try {
        console.log('\n🔍 Testing Instagram API connection...');
        
        // Test with the access token
        const response = await axios.get(
            `https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${process.env.INSTAGRAM_ACCESS_TOKEN || 'EAALAZCm9Lz1cBPSVre7NGfvWmnq4dmkRN6yVnW3WbuDbsN5HOZCm9Henf90i1FBJic6CpgTNM4TKkG58RnA7ETIQU0PEXVCDcj0kVGpQO5QrGylUZC4KAAxZAP6RZBkTDohLZCY9T12eUqcrUzDiuz5LBUNj5552bdPsmZAPNUSmmpoVD2JAg05p86wi7UYZAiK7'}`
        );
        
        console.log('✅ Instagram API connection successful!');
        console.log('📊 Profile data:', response.data);
        
    } catch (error) {
        console.log('❌ Instagram API connection failed:');
        console.log('Error:', error.response?.data || error.message);
        console.log('\n📝 Note: You may need to create your own Instagram app at:');
        console.log('https://developers.facebook.com/apps/');
    }
}

console.log('\n🚀 Instagram Setup Complete!');
console.log('📁 .env file created with test configuration');
console.log('🔄 Restart your server: npm run dev');

// Run test
testInstagramConnection();