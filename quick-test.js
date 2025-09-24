// Quick test for webhook verification
const axios = require('axios');

const testCurrentSetup = async () => {
  console.log('Testing current webhook setup...\n');
  
  // Test localhost (should work)
  console.log('✅ Localhost test:');
  try {
    const response = await axios.get('http://localhost:5000/api/auth/instagram/callback?hub.mode=subscribe&hub.verify_token=IGAG5YUDLCEV9BZAE5EjVKMHlmVnFSRjA3NjNYaF9VQTNiVEdzbTZA6TW02b0w5b3ZAkb0hkTDNpQnB1T2ozNTd3MWVTYmQzdjYT3Z&hub.challenge=test123');
    console.log(`Status: ${response.status}, Response: ${response.data}`);
  } catch (error) {
    console.log(`❌ Failed: ${error.response?.status} ${error.response?.statusText}`);
  }
  
  console.log('\n📝 Next steps:');
  console.log('1. Install ngrok: https://ngrok.com/download');
  console.log('2. Run: ngrok http 5000');
  console.log('3. Copy the HTTPS URL from ngrok');
  console.log('4. Update Instagram webhook URL: [ngrok-url]/api/auth/instagram/callback');
  console.log('5. Use verify token: IGAG5YUDLCEV9BZAE5EjVKMHlmVnFSRjA3NjNYaF9VQTNiVEdzbTZA6TW02b0w5b3ZAkb0hkTDNpQnB1T2ozNTd3MWVTYmQzdjYT3Z');
};

testCurrentSetup();
