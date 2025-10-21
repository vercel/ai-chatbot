// Test script để test integration với ứng dụng
const https = require('https');

// Test với format chính xác từ test results
const configs = {
  "npo-yen-model": {
    serverIP: "10.196.5.134",
    port: "28001",
    assetId: "70",
    username: "aiteam1",
    password: "AInow123@",
  },
  "cs-ai-model": {
    serverIP: "10.196.5.134",
    port: "28001",
    assetId: "56",
    username: "aiteam1",
    password: "AInow123@",
  },
  "cs-minh-model": {
    serverIP: "10.196.5.134",
    port: "28001",
    assetId: "68",
    username: "aiteam1",
    password: "AInow123@",
  },
};

async function testModel(modelId, config, message) {
  const apiUrl = `https://${config.serverIP}:${config.port}/api/ifactory-agent-run/v1/chat/api/${config.assetId}`;
  const sessionId = `app_test_${Date.now()}`;
  
  const payload = {
    sessionInfo: {
      sessionId: sessionId
    },
    contentType: "rich-text",
    content: message
  };

  console.log(`\n=== Testing ${modelId} ===`);
  console.log(`Message: "${message}"`);
  console.log(`Asset ID: ${config.assetId}`);

  return new Promise((resolve, reject) => {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'username': config.username,
        'password': Buffer.from(config.password).toString('base64'),
      },
      rejectUnauthorized: false
    };

    const req = https.request(apiUrl, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          
          if (res.statusCode === 200) {
            if (jsonData.content && jsonData.content.includes("Error 704002")) {
              console.log(`❌ ${modelId}: AI Agent error - ${jsonData.content}`);
              resolve({ success: false, error: jsonData.content });
            } else if (jsonData.content) {
              console.log(`✅ ${modelId}: Success!`);
              console.log(`Response: ${jsonData.content.substring(0, 100)}...`);
              resolve({ success: true, response: jsonData });
            } else {
              console.log(`❌ ${modelId}: No content in response`);
              resolve({ success: false, error: 'No content' });
            }
          } else {
            console.log(`❌ ${modelId}: HTTP ${res.statusCode}`);
            resolve({ success: false, error: `HTTP ${res.statusCode}` });
          }
        } catch (e) {
          console.log(`❌ ${modelId}: JSON Parse Error - ${e.message}`);
          resolve({ success: false, error: e.message });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${modelId}: Request Error - ${error.message}`);
      resolve({ success: false, error: error.message });
    });

    req.write(JSON.stringify(payload));
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing App Integration with AI Models...\n');
  
  const testMessage = "Hello, can you help me with network optimization?";
  
  for (const [modelId, config] of Object.entries(configs)) {
    await testModel(modelId, config, testMessage);
  }
  
  console.log('\n=== SUMMARY ===');
  console.log('All models tested. Check results above.');
  console.log('\nIf all models work, the issue might be in the app integration.');
  console.log('Check browser console logs when sending messages in the app.');
}

runTests().catch(console.error);
