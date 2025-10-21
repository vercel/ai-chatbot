// Simple test để kiểm tra format request
const https = require('https');

const config = {
  serverIP: "10.196.5.134",
  port: "28001",
  assetId: "70",
  username: "aiteam1",
  password: "AInow123@",
};

const apiUrl = `https://${config.serverIP}:${config.port}/api/ifactory-agent-run/v1/chat/api/${config.assetId}`;

// Test với payload đơn giản
const payload = {
  sessionInfo: {
    sessionId: "test123"
  },
  contentType: "rich-text",
  content: "Hello"
};

console.log('Testing simple request...');
console.log('URL:', apiUrl);
console.log('Payload:', JSON.stringify(payload, null, 2));

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'username': config.username,
    'password': Buffer.from(config.password).toString('base64'),
  },
  rejectUnauthorized: false
};

const req = https.request(apiUrl, options, (res) => {
  console.log(`\nStatus: ${res.statusCode}`);
  console.log('Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\nResponse body:');
    try {
      const jsonData = JSON.parse(data);
      console.log(JSON.stringify(jsonData, null, 2));
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.write(JSON.stringify(payload));
req.end();
