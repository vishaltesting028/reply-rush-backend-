/**
 * Instagram Graph API Test Script
 * Use this script to test your Instagram Graph API integration
 * 
 * Usage: node test-instagram-graph.js
 */

require('dotenv').config();

const BASE_URL = 'http://localhost:5000';

// Test configuration
const TESTS = {
  health: true,
  validate: true,
  profile: true,
  posts: true,
  insights: false // Set to true if you want to test insights (Business accounts only)
};

/**
 * Make HTTP request with error handling
 */
async function makeRequest(endpoint, description) {
  try {
    console.log(`\n🧪 Testing: ${description}`);
    console.log(`📡 Request: GET ${BASE_URL}${endpoint}`);
    
    const response = await fetch(`${BASE_URL}${endpoint}`);
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log(`✅ Success: ${data.message}`);
      return data;
    } else {
      console.log(`❌ Failed: ${data.error || data.message}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Network Error: ${error.message}`);
    return null;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🚀 Instagram Graph API Integration Test');
  console.log('=====================================');
  
  // Check environment variables
  console.log('\n📋 Environment Check:');
  console.log(`IG_ACCESS_TOKEN: ${process.env.IG_ACCESS_TOKEN ? '✅ Set' : '❌ Missing'}`);
  console.log(`IG_USER_ID: ${process.env.IG_USER_ID ? '✅ Set' : '❌ Missing'}`);
  
  if (!process.env.IG_ACCESS_TOKEN || !process.env.IG_USER_ID) {
    console.log('\n⚠️  Please set IG_ACCESS_TOKEN and IG_USER_ID in your .env file');
    console.log('See INSTAGRAM_GRAPH_API_SETUP.md for instructions');
    return;
  }

  const results = {};

  // Test 1: Health Check
  if (TESTS.health) {
    const healthData = await makeRequest('/instagram/health', 'Health Check');
    results.health = healthData;
    
    if (healthData?.data) {
      console.log(`   Service Status: ${healthData.data.service_status}`);
      console.log(`   Credentials: ${healthData.data.credentials_configured ? '✅' : '❌'}`);
      console.log(`   Token Valid: ${healthData.data.token_status?.valid ? '✅' : '❌'}`);
    }
  }

  // Test 2: Token Validation
  if (TESTS.validate) {
    const validateData = await makeRequest('/instagram/validate', 'Token Validation');
    results.validate = validateData;
    
    if (validateData?.data) {
      console.log(`   User ID: ${validateData.data.user_id}`);
      console.log(`   Username: ${validateData.data.username}`);
    }
  }

  // Test 3: Profile Information
  if (TESTS.profile) {
    const profileData = await makeRequest('/instagram/profile', 'Profile Information');
    results.profile = profileData;
    
    if (profileData?.data) {
      console.log(`   Username: @${profileData.data.username}`);
      console.log(`   Followers: ${profileData.data.followers_count?.toLocaleString() || 0}`);
      console.log(`   Media Count: ${profileData.data.media_count?.toLocaleString() || 0}`);
      console.log(`   Account Type: ${profileData.data.account_type}`);
    }
  }

  // Test 4: Recent Posts
  if (TESTS.posts) {
    const postsData = await makeRequest('/instagram/posts?limit=5', 'Recent Posts (5 items)');
    results.posts = postsData;
    
    if (postsData?.data?.posts) {
      console.log(`   Posts Retrieved: ${postsData.data.posts.length}`);
      postsData.data.posts.forEach((post, index) => {
        console.log(`   ${index + 1}. ${post.media_type} - ${post.formatted_date}`);
        if (post.caption) {
          const shortCaption = post.caption.length > 50 
            ? post.caption.substring(0, 50) + '...' 
            : post.caption;
          console.log(`      Caption: "${shortCaption}"`);
        }
      });
    }
  }

  // Test 5: Insights (Business accounts only)
  if (TESTS.insights) {
    const insightsData = await makeRequest('/instagram/insights?period=day', 'Account Insights');
    results.insights = insightsData;
    
    if (insightsData?.data?.insights) {
      console.log(`   Insights Retrieved: ${insightsData.data.insights.length}`);
      insightsData.data.insights.forEach(insight => {
        console.log(`   ${insight.name}: ${insight.values?.[0]?.value || 'N/A'}`);
      });
    }
  }

  // Summary
  console.log('\n📊 Test Summary:');
  console.log('================');
  
  const testResults = Object.entries(results);
  const passedTests = testResults.filter(([_, result]) => result?.success).length;
  const totalTests = testResults.length;
  
  testResults.forEach(([test, result]) => {
    console.log(`${result?.success ? '✅' : '❌'} ${test.charAt(0).toUpperCase() + test.slice(1)}`);
  });
  
  console.log(`\n🎯 Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Your Instagram Graph API integration is working correctly.');
    console.log('\n📚 Next steps:');
    console.log('   1. Integrate these endpoints into your frontend');
    console.log('   2. Add error handling for production use');
    console.log('   3. Consider implementing caching for better performance');
    console.log('   4. Set up token refresh reminders (60-day expiry)');
  } else {
    console.log('⚠️  Some tests failed. Check the errors above and:');
    console.log('   1. Verify your .env configuration');
    console.log('   2. Check your Instagram Business Account setup');
    console.log('   3. Ensure your access token is valid and not expired');
    console.log('   4. Review the INSTAGRAM_GRAPH_API_SETUP.md guide');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ Test script error:', error);
    process.exit(1);
  });
}

module.exports = { runTests, makeRequest };
