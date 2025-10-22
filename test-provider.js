// Script debug để test custom provider
// Chạy: node test-provider.js

async function testCustomProvider() {
  console.log("=== Testing Custom Provider ===");
  
  try {
    const { internalAIProvider } = await import("./lib/ai/custom-provider.js");
    const { generateText } = await import("ai");
    
    const result = await generateText({
      model: internalAIProvider.languageModel("npo-yen-model"),
      system: "You are a helpful assistant.",
      messages: [{ role: "user", content: "what is npo?" }],
    });
    
    console.log("✅ Success:", result);
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testCustomProvider();
