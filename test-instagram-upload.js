const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:5000'; // Adjust to your server URL
const TEST_IMAGE_URL = 'https://picsum.photos/1080/1080'; // Test image URL
const TEST_VIDEO_URL = 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'; // Test video URL

class InstagramUploadTester {
  constructor() {
    this.results = [];
  }

  async log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    console.log(logMessage);
    this.results.push({ timestamp, type, message });
  }

  async testEndpoint(name, method, endpoint, data = null) {
    try {
      await this.log(`Testing ${name}...`);
      
      const config = {
        method,
        url: `${BASE_URL}${endpoint}`,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      
      await this.log(`✅ ${name} - Success: ${response.data.message || 'OK'}`, 'success');
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      await this.log(`❌ ${name} - Error: ${errorMessage}`, 'error');
      return { success: false, error: errorMessage, status: error.response?.status };
    }
  }

  async checkInstagramConnection() {
    await this.log('=== Checking Instagram Connection Status ===');
    return await this.testEndpoint(
      'Instagram Connection Status',
      'GET',
      '/api/instagram/status'
    );
  }

  async testPhotoUpload() {
    await this.log('=== Testing Single Photo Upload ===');
    return await this.testEndpoint(
      'Single Photo Upload',
      'POST',
      '/api/instagram/upload/photo',
      {
        imageUrl: TEST_IMAGE_URL,
        caption: 'Test photo upload from ReplyRush API 📸 #test #api'
      }
    );
  }

  async testCarouselUpload() {
    await this.log('=== Testing Carousel Upload ===');
    return await this.testEndpoint(
      'Carousel Upload',
      'POST',
      '/api/instagram/upload/carousel',
      {
        imageUrls: [
          'https://picsum.photos/1080/1080?random=1',
          'https://picsum.photos/1080/1080?random=2',
          'https://picsum.photos/1080/1080?random=3'
        ],
        caption: 'Test carousel upload from ReplyRush API 🎠 #carousel #test #api'
      }
    );
  }

  async testVideoUpload() {
    await this.log('=== Testing Video Upload ===');
    return await this.testEndpoint(
      'Video Upload',
      'POST',
      '/api/instagram/upload/video',
      {
        videoUrl: TEST_VIDEO_URL,
        caption: 'Test video upload from ReplyRush API 🎥 #video #test #api'
      }
    );
  }

  async testStoryUpload() {
    await this.log('=== Testing Story Upload ===');
    return await this.testEndpoint(
      'Story Upload',
      'POST',
      '/api/instagram/upload/story',
      {
        mediaUrl: TEST_IMAGE_URL,
        mediaType: 'IMAGE'
      }
    );
  }

  async testUploadStatus(containerId) {
    if (!containerId) {
      await this.log('⚠️ No container ID provided for status check', 'warning');
      return { success: false, error: 'No container ID' };
    }

    await this.log('=== Testing Upload Status Check ===');
    return await this.testEndpoint(
      'Upload Status Check',
      'GET',
      `/api/instagram/upload/status/${containerId}`
    );
  }

  async runAllTests() {
    await this.log('🚀 Starting Instagram Upload API Tests');
    await this.log('==========================================');

    // Check connection first
    const connectionResult = await this.checkInstagramConnection();
    if (!connectionResult.success) {
      await this.log('❌ Instagram not connected. Please connect your Instagram account first.', 'error');
      return this.generateReport();
    }

    if (!connectionResult.data?.data?.isConnected) {
      await this.log('❌ Instagram account not connected. Please connect your Instagram account first.', 'error');
      return this.generateReport();
    }

    await this.log(`✅ Instagram connected as: ${connectionResult.data.data.username}`, 'success');

    // Test photo upload
    const photoResult = await this.testPhotoUpload();
    let containerId = photoResult.data?.data?.containerId;

    // Test carousel upload
    await this.testCarouselUpload();

    // Test video upload (may take longer)
    await this.testVideoUpload();

    // Test story upload
    await this.testStoryUpload();

    // Test status check if we have a container ID
    if (containerId) {
      await this.testUploadStatus(containerId);
    }

    return this.generateReport();
  }

  generateReport() {
    const successCount = this.results.filter(r => r.type === 'success').length;
    const errorCount = this.results.filter(r => r.type === 'error').length;
    const warningCount = this.results.filter(r => r.type === 'warning').length;

    const report = {
      summary: {
        total: this.results.length,
        success: successCount,
        errors: errorCount,
        warnings: warningCount,
        timestamp: new Date().toISOString()
      },
      results: this.results
    };

    console.log('\n==========================================');
    console.log('📊 TEST SUMMARY');
    console.log('==========================================');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`⚠️ Warnings: ${warningCount}`);
    console.log('==========================================\n');

    // Save report to file
    const reportPath = path.join(__dirname, 'instagram-upload-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Full report saved to: ${reportPath}`);

    return report;
  }
}

// Test specific endpoint
async function testSingleEndpoint(endpoint) {
  const tester = new InstagramUploadTester();
  
  switch (endpoint) {
    case 'photo':
      await tester.checkInstagramConnection();
      await tester.testPhotoUpload();
      break;
    case 'carousel':
      await tester.checkInstagramConnection();
      await tester.testCarouselUpload();
      break;
    case 'video':
      await tester.checkInstagramConnection();
      await tester.testVideoUpload();
      break;
    case 'story':
      await tester.checkInstagramConnection();
      await tester.testStoryUpload();
      break;
    case 'status':
      await tester.checkInstagramConnection();
      break;
    default:
      console.log('❌ Unknown endpoint. Available: photo, carousel, video, story, status');
      return;
  }
  
  tester.generateReport();
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const tester = new InstagramUploadTester();

  if (args.length > 0) {
    // Test specific endpoint
    await testSingleEndpoint(args[0]);
  } else {
    // Run all tests
    await tester.runAllTests();
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error);
  process.exit(1);
});

// Export for use in other files
module.exports = { InstagramUploadTester };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
