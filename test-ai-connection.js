// Test script để kiểm tra kết nối đến AI agent
const https = require('https');

// Cấu hình test
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

async function testAIConnection(modelId, config) {
  const apiUrl = `https://${config.serverIP}:${config.port}/api/ifactory-agent-run/v1/chat/api/${config.assetId}`;
  const sessionId = `test_session_${Date.now()}`;
  
  const payload = {
    sessionInfo: {
      sessionId: sessionId
    },
    contentType: "rich-text",
    content: "Hello, this is a test message"
  };

  console.log(`\n=== Testing ${modelId} ===`);
  console.log(`URL: ${apiUrl}`);
  console.log(`Payload:`, JSON.stringify(payload, null, 2));

  return new Promise((resolve, reject) => {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'username': config.username,
        'password': Buffer.from(config.password).toString('base64'),
      },
      // Bỏ qua SSL verification
      rejectUnauthorized: false
    };

    const req = https.request(apiUrl, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Headers:`, res.headers);
        
        try {
          const jsonData = JSON.parse(data);
          console.log(`Response:`, JSON.stringify(jsonData, null, 2));
          
          if (res.statusCode === 200) {
            if (jsonData.code && jsonData.code !== 0) {
              console.log(`❌ AI Agent returned error code: ${jsonData.code}`);
              resolve({ success: false, error: `AI Agent error: ${jsonData.message}` });
            } else {
              console.log(`✅ Success! Response: ${jsonData.content}`);
              resolve({ success: true, response: jsonData });
            }
          } else {
            console.log(`❌ HTTP Error: ${res.statusCode}`);
            resolve({ success: false, error: `HTTP ${res.statusCode}: ${data}` });
          }
        } catch (e) {
          console.log(`❌ JSON Parse Error:`, e.message);
          console.log(`Raw response:`, data);
          resolve({ success: false, error: `JSON Parse Error: ${e.message}` });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Request Error:`, error.message);
      resolve({ success: false, error: error.message });
    });

    req.write(JSON.stringify(payload));
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing AI Agent Connections...\n');
  
  const results = {};
  
  for (const [modelId, config] of Object.entries(configs)) {
    results[modelId] = await testAIConnection(modelId, config);
  }
  
  console.log('\n=== SUMMARY ===');
  for (const [modelId, result] of Object.entries(results)) {
    if (result.success) {
      console.log(`✅ ${modelId}: Connected successfully`);
    } else {
      console.log(`❌ ${modelId}: ${result.error}`);
    }
  }
}

runTests().catch(console.error);
