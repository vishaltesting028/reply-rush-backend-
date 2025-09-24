// Test Instagram webhook verification endpoint
const axios = require('axios');

const testWebhookVerification = async () => {
  console.log('=== Testing Webhook Verification ===\n');
  
  // Test 1: Local endpoint
  console.log('1. Testing localhost endpoint...');
  try {
    const response = await axios.get('http://localhost:5000/api/auth/instagram/callback', {
      params: {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'IGAG5YUDLCEV9BZAE5EjVKMHlmVnFSRjA3NjNYaF9VQTNiVEdzbTZA6TW02b0w5b3ZAkb0hkTDNpQnB1T2ozNTd3MWVTYmQzdjYT3Z',
        'hub.challenge': 'test123456'
      }
    });
    
    console.log('✅ Localhost test successful!');
    console.log('Status:', response.status);
    console.log('Response:', response.data);
    
  } catch (error) {
    console.log('❌ Localhost test failed!');
    console.log('Error:', error.response?.status, error.response?.statusText);
  }
  
  // Test 2: ngrok endpoint
  console.log('\n2. Testing ngrok endpoint...');
  try {
    const response = await axios.get('https://24e496dd3ed2.ngrok-free.app/api/auth/instagram/callback', {
      params: {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'IGAG5YUDLCEV9BZAE5EjVKMHlmVnFSRjA3NjNYaF9VQTNiVEdzbTZA6TW02b0w5b3ZAkb0hkTDNpQnB1T2ozNTd3MWVTYmQzdjYT3Z',
        'hub.challenge': 'ngrok_test_123'
      },
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    });
    
    console.log('✅ ngrok test successful!');
    console.log('Status:', response.status);
    console.log('Response:', response.data);
    
  } catch (error) {
    console.log('❌ ngrok test failed!');
    console.log('Error:', error.response?.status, error.response?.statusText);
    console.log('Data:', error.response?.data);
  }
  
  // Test 3: Wrong token (should fail)
  console.log('\n3. Testing with wrong token (should fail)...');
  try {
    const response = await axios.get('http://localhost:5000/api/auth/instagram/callback', {
      params: {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'wrong_token',
        'hub.challenge': 'should_fail'
      }
    });
    
    console.log('❌ Wrong token test should have failed but succeeded!');
    
  } catch (error) {
    console.log('✅ Wrong token test correctly failed with status:', error.response?.status);
  }
};

testWebhookVerification();
