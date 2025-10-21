// Script test kết nối với AI agent nội bộ
// Chạy: node test-internal-ai.js

const https = require('https');

// Cấu hình AI Agent nội bộ (có thể override bằng environment variables)
const config = {
  serverIP: process.env.INTERNAL_AI_SERVER_IP || "10.196.5.134",
  port: process.env.INTERNAL_AI_PORT || "28001",
  assetId: process.env.INTERNAL_AI_ASSET_ID || "70",
  username: process.env.INTERNAL_AI_USERNAME || "aiteam1",
  password: process.env.INTERNAL_AI_PASSWORD || "Z_tywg_2025",
};

async function testInternalAI() {
  const apiUrl = `https://${config.serverIP}:${config.port}/api/ifactory-agent-run/v1/chat/api/${config.assetId}`;
  const sessionId = `test_session_${Date.now()}`;
  
  const payload = {
    sessionInfo: {
      sessionId: sessionId
    },
    contentType: "rich-text",
    content: "Hello, this is a test message from the chatbot application."
  };

  console.log('🔍 Testing connection to internal AI agent...');
  console.log(`📍 URL: ${apiUrl}`);
  console.log(`👤 Username: ${config.username}`);
  console.log(`🆔 Asset ID: ${config.assetId}`);
  console.log(`📝 Test message: ${payload.content}`);
  console.log('─'.repeat(50));

  try {
    const response = await makeRequest(apiUrl, payload);
    
    if (response.statusCode === 200) {
      console.log('✅ Connection successful!');
      console.log('📄 Response:');
      console.log(JSON.stringify(response.data, null, 2));
    } else {
      console.log(`❌ Connection failed! Status: ${response.statusCode}`);
      console.log('📄 Error response:');
      console.log(response.data);
    }
  } catch (error) {
    console.log(`❌ Connection error: ${error.message}`);
    console.log('💡 Make sure you are connected to the internal network and the AI agent is running.');
  }
}

function makeRequest(url, payload) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(payload);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'username': config.username,
        'password': Buffer.from(config.password).toString('base64'),
      },
      // Bỏ qua SSL verification cho mạng nội bộ
      rejectUnauthorized: false
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            data: parsedData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Chạy test
testInternalAI().catch(console.error);
