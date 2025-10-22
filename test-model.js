// Script debug đơn giản để test trực tiếp với model API
// Chạy: node test-model.js

const https = require('https');

const config = {
  serverIP: "10.196.5.134",
  port: "28001",
  assetId: "70",
  username: "aiteam1",
  password: "AInow123@"
};

function makeRequest(payload) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    
    const options = {
      hostname: config.serverIP,
      port: config.port,
      path: `/api/ifactory-agent-run/v1/chat/api/${config.assetId}`,
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "username": config.username,
        "password": Buffer.from(config.password).toString('base64'),
      },
      rejectUnauthorized: false
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const responseData = JSON.parse(data);
          resolve({ status: res.statusCode, data: responseData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function testAPI() {
  console.log("=== Testing Model API ===");
  
  const payload = {
    sessionInfo: { sessionId: `test_${Date.now()}` },
    content: "what is npo?"
  };
  
  console.log("Request:", JSON.stringify(payload, null, 2));
  
  try {
    const result = await makeRequest(payload);
    console.log("Response:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testAPI();
