const axios = require('axios');
require('dotenv').config();

// Your Instagram access token
const ACCESS_TOKEN = 'EAALAZCm9Lz1cBPSVre7NGfvWmnq4dmkRN6yVnW3WbuDbsN5HOZCm9Henf90i1FBJic6CpgTNM4TKkG58RnA7ETIQU0PEXVCDcj0kVGpQO5QrGylUZC4KAAxZAP6RZBkTDohLZCY9T12eUqcrUzDiuz5LBUNj5552bdPsmZAPNUSmmpoVD2JAg05p86wi7UYZAiK7';

async function testInstagramAPI() {
  console.log('🔄 Testing Instagram API with your access token...\n');

  try {
    // Test 1: Get user profile
    console.log('1️⃣ Testing user profile...');
    const profileResponse = await axios.get(`https://graph.instagram.com/me`, {
      params: {
        fields: 'id,username,account_type,media_count',
        access_token: ACCESS_TOKEN
      }
    });
    console.log('✅ Profile:', profileResponse.data);
    console.log('');

    // Test 2: Get user media/posts
    console.log('2️⃣ Testing user posts...');
    const postsResponse = await axios.get(`https://graph.instagram.com/me/media`, {
      params: {
        fields: 'id,caption,media_type,media_url,thumbnail_url,timestamp,permalink',
        access_token: ACCESS_TOKEN,
        limit: 5
      }
    });
    console.log('✅ Posts found:', postsResponse.data.data.length);
    console.log('Posts:', postsResponse.data.data.map(post => ({
      id: post.id,
      type: post.media_type,
      caption: post.caption?.substring(0, 50) + '...' || 'No caption'
    })));
    console.log('');

    // Test 3: Try to get insights for first post (if available)
    if (postsResponse.data.data.length > 0) {
      const firstPostId = postsResponse.data.data[0].id;
      console.log('3️⃣ Testing post insights...');
      
      try {
        const insightsResponse = await axios.get(`https://graph.instagram.com/${firstPostId}/insights`, {
          params: {
            metric: 'impressions,reach,engagement',
            access_token: ACCESS_TOKEN
          }
        });
        console.log('✅ Insights:', insightsResponse.data.data);
      } catch (insightsError) {
        console.log('⚠️ Insights not available:', insightsError.response?.data?.error?.message || 'Business account required');
      }
    }

    console.log('\n🎉 Instagram API test completed successfully!');
    console.log('Your access token is working properly.');

  } catch (error) {
    console.error('❌ Error testing Instagram API:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('🔑 Token might be expired or invalid');
    } else if (error.response?.status === 400) {
      console.log('📋 Check your token permissions and account type');
    }
  }
}

// Run the test
testInstagramAPI();
