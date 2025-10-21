// Debug script để kiểm tra messages structure
console.log('Testing different message structures...\n');

// Test 1: AI SDK v2 format
const messages1 = [
  {
    id: "msg1",
    role: "user",
    content: "Hello, how are you?"
  }
];

console.log('=== Test 1: Simple string content ===');
console.log('Messages:', JSON.stringify(messages1, null, 2));

// Extract logic
let userMessage1 = "";
if (messages1 && messages1.length > 0) {
  const lastUserMessage = messages1.filter(msg => msg.role === "user").pop();
  if (lastUserMessage) {
    if (typeof lastUserMessage.content === 'string') {
      userMessage1 = lastUserMessage.content;
    }
  }
}
console.log('Extracted:', userMessage1);

// Test 2: AI SDK v2 format with parts
const messages2 = [
  {
    id: "msg2",
    role: "user",
    parts: [
      { type: "text", text: "Hello, how are you?" }
    ]
  }
];

console.log('\n=== Test 2: Parts structure ===');
console.log('Messages:', JSON.stringify(messages2, null, 2));

let userMessage2 = "";
if (messages2 && messages2.length > 0) {
  const lastUserMessage = messages2.filter(msg => msg.role === "user").pop();
  if (lastUserMessage) {
    if (lastUserMessage.parts && Array.isArray(lastUserMessage.parts)) {
      userMessage2 = lastUserMessage.parts.map((part) => {
        if (typeof part === 'string') return part;
        if (part.text) return part.text;
        if (part.content) return part.content;
        return String(part);
      }).join(' ');
    }
  }
}
console.log('Extracted:', userMessage2);

// Test 3: Array content
const messages3 = [
  {
    id: "msg3",
    role: "user",
    content: [
      { type: "text", text: "Hello, how are you?" }
    ]
  }
];

console.log('\n=== Test 3: Array content ===');
console.log('Messages:', JSON.stringify(messages3, null, 2));

let userMessage3 = "";
if (messages3 && messages3.length > 0) {
  const lastUserMessage = messages3.filter(msg => msg.role === "user").pop();
  if (lastUserMessage) {
    if (Array.isArray(lastUserMessage.content)) {
      userMessage3 = lastUserMessage.content.map((part) => {
        if (typeof part === 'string') return part;
        if (part.text) return part.text;
        if (part.content) return part.content;
        return String(part);
      }).join(' ');
    }
  }
}
console.log('Extracted:', userMessage3);

// Test 4: Undefined messages
const messages4 = undefined;

console.log('\n=== Test 4: Undefined messages ===');
console.log('Messages:', messages4);

let userMessage4 = "";
if (messages4 && messages4.length > 0) {
  const lastUserMessage = messages4.filter(msg => msg.role === "user").pop();
  if (lastUserMessage) {
    // ... same logic
  }
}
console.log('Extracted:', userMessage4);

console.log('\n=== Summary ===');
console.log('Test 1 (string content):', userMessage1 ? 'SUCCESS' : 'FAILED');
console.log('Test 2 (parts structure):', userMessage2 ? 'SUCCESS' : 'FAILED');
console.log('Test 3 (array content):', userMessage3 ? 'SUCCESS' : 'FAILED');
console.log('Test 4 (undefined):', userMessage4 ? 'SUCCESS' : 'FAILED');
