// Minimal test với format đơn giản nhất
const https = require('https');

const config = {
  serverIP: "10.196.5.134",
  port: "28001",
  assetId: "70",
  username: "aiteam1",
  password: "AInow123@",
};

const apiUrl = `https://${config.serverIP}:${config.port}/api/ifactory-agent-run/v1/chat/api/${config.assetId}`;

// Test 1: Format đơn giản nhất
console.log('=== Test 1: Minimal payload ===');
const payload1 = {
  content: "Hello"
};

testRequest(payload1, 'Minimal');

// Test 2: Với sessionInfo
console.log('\n=== Test 2: With sessionInfo ===');
const payload2 = {
  sessionInfo: {
    sessionId: "test123"
  },
  content: "Hello"
};

testRequest(payload2, 'With sessionInfo');

// Test 3: Full format
console.log('\n=== Test 3: Full format ===');
const payload3 = {
  sessionInfo: {
    sessionId: "test123"
  },
  contentType: "rich-text",
  content: "Hello"
};

testRequest(payload3, 'Full format');

function testRequest(payload, testName) {
  console.log(`${testName} payload:`, JSON.stringify(payload, null, 2));
  
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
    console.log(`Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response:', data);
      console.log('---');
    });
  });

  req.on('error', (error) => {
    console.error('Error:', error.message);
    console.log('---');
  });

  req.write(JSON.stringify(payload));
  req.end();
}
