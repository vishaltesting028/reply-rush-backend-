const axios = require('axios');

// Test script to verify profile update functionality
async function testProfileUpdate() {
  const baseURL = 'http://localhost:5000';
  
  // Test data
  const testProfile = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    bio: 'Software Developer with 5 years of experience',
    company: 'Tech Solutions Inc',
    website: 'https://johndoe.dev'
  };

  try {
    console.log('Testing profile update functionality...\n');

    // First, let's test if the profile endpoint exists
    console.log('1. Testing GET /api/profile endpoint...');
    try {
      const getResponse = await axios.get(`${baseURL}/api/profile`, {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      console.log('✅ GET endpoint exists');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ GET endpoint exists (requires authentication)');
      } else {
        console.log('❌ GET endpoint error:', error.message);
      }
    }

    // Test PUT endpoint
    console.log('\n2. Testing PUT /api/profile endpoint...');
    try {
      const putResponse = await axios.put(`${baseURL}/api/profile`, testProfile, {
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ PUT endpoint exists');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ PUT endpoint exists (requires authentication)');
      } else {
        console.log('❌ PUT endpoint error:', error.message);
      }
    }

    console.log('\n3. Testing server health...');
    try {
      const healthResponse = await axios.get(`${baseURL}/health`);
      console.log('✅ Server is running:', healthResponse.data);
    } catch (error) {
      console.log('❌ Server health check failed:', error.message);
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testProfileUpdate();
