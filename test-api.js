const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testAPI() {
  console.log('🧪 Testing Referral System API...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('✅ Health check passed:', healthResponse.data);

    // Test invite endpoint
    console.log('\n2. Testing invite endpoint...');
    const inviteData = {
      email: 'test@example.com',
      username: 'testuser'
    };
    const inviteResponse = await axios.post(`${API_BASE}/referrals/invite`, inviteData);
    console.log('✅ User invited successfully:', inviteResponse.data);

    // Test status endpoint
    console.log('\n3. Testing status endpoint...');
    const statusResponse = await axios.get(`${API_BASE}/referrals/status?userId=${inviteResponse.data.user.id}`);
    console.log('✅ Status retrieved successfully:', statusResponse.data);

    // Test convert credits endpoint
    console.log('\n4. Testing convert credits endpoint...');
    const convertResponse = await axios.post(`${API_BASE}/referrals/convert-credits`, {
      userId: inviteResponse.data.user.id
    });
    console.log('✅ Convert credits test completed:', convertResponse.data);

    console.log('\n🎉 All API tests passed!');
    console.log('\n📋 Test Results:');
    console.log('- Health endpoint: ✅');
    console.log('- Invite endpoint: ✅');
    console.log('- Status endpoint: ✅');
    console.log('- Convert credits endpoint: ✅');

  } catch (error) {
    console.error('❌ API test failed:', error.response?.data || error.message);
    console.log('\n💡 Make sure:');
    console.log('1. The server is running (npm run server)');
    console.log('2. MongoDB is connected');
    console.log('3. The API is accessible at http://localhost:5000');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testAPI();
}

module.exports = { testAPI }; 