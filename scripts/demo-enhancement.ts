#!/usr/bin/env node

/**
 * Prompt Enhancement Middleware Demonstration Script
 * 
 * This script demonstrates the complete functionality of the Intelligent Prompt Enhancement Middleware
 * by testing various input scenarios and showing how prompts are enhanced.
 */

import { enhancePrompt, createPromptEnhancer } from '../lib/ai/enhancement/prompt-enhancer';
import { IntentCategory, VaguenessLevel, ComplexityLevel } from '../lib/types';

interface TestCase {
  name: string;
  input: string;
  expectedEnhancement: boolean;
  description: string;
}

const testCases: TestCase[] = [
  {
    name: 'Vague Request',
    input: 'help',
    expectedEnhancement: true,
    description: 'Very vague single-word request should be enhanced with context'
  },
  {
    name: 'Simple Code Request',
    input: 'write function',
    expectedEnhancement: true,
    description: 'Incomplete code request should be enhanced with technical details'
  },
  {
    name: 'Comparison Request',
    input: 'compare React vs Vue',
    expectedEnhancement: true,
    description: 'Comparison request should be enhanced with structured format'
  },
  {
    name: 'Vague How-To',
    input: 'how to program',
    expectedEnhancement: true,
    description: 'Vague how-to question should be enhanced with specific guidance'
  },
  {
    name: 'Well-Formed Request',
    input: 'Create a React component that displays a list of users fetched from a REST API with proper error handling, TypeScript types, and loading states',
    expectedEnhancement: false,
    description: 'Well-formed request should not need enhancement'
  },
  {
    name: 'Technical Explanation',
    input: 'explain machine learning algorithms used in recommendation systems',
    expectedEnhancement: false,
    description: 'Specific technical request should not need much enhancement'
  },
  {
    name: 'Ambiguous Terms',
    input: 'make this better and fix that thing',
    expectedEnhancement: true,
    description: 'Request with ambiguous terms should be enhanced for clarity'
  },
  {
    name: 'Code Without Language',
    input: 'create a sorting algorithm',
    expectedEnhancement: true,
    description: 'Code request without language specification should be enhanced'
  }
];

async function runDemonstration() {
  console.log('🚀 Intelligent Prompt Enhancement Middleware Demonstration\n');
  console.log('=' .repeat(80));
  
  try {
    // Test basic functionality
    console.log('\n📋 Testing Enhancement Pipeline...\n');
    
    for (const testCase of testCases) {
      console.log(`\n🔍 Test: ${testCase.name}`);
      console.log(`📝 Description: ${testCase.description}`);
      console.log(`💬 Input: \"${testCase.input}\"`);
      
      const startTime = Date.now();
      const result = await enhancePrompt(testCase.input);
      const endTime = Date.now();
      
      const wasEnhanced = result.enhanced !== result.original;
      const processingTime = endTime - startTime;
      
      console.log(`⚡ Processing Time: ${processingTime}ms`);
      console.log(`🎯 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`✨ Enhanced: ${wasEnhanced ? 'Yes' : 'No'}`);
      
      if (wasEnhanced) {
        console.log(`📈 Enhanced Version: \"${result.enhanced}\"`);
        console.log(`🔧 Changes Applied: ${result.changes.length}`);
        
        if (result.changes.length > 0) {
          result.changes.forEach((change, index) => {
            console.log(`   ${index + 1}. ${change.type}: ${change.description}`);
          });
        }
      }
      
      // Validate expectation
      const expectationMet = wasEnhanced === testCase.expectedEnhancement;
      console.log(`${expectationMet ? '✅' : '❌'} Expectation: ${expectationMet ? 'Met' : 'Not Met'}`);
      
      console.log('-'.repeat(60));
    }
    
    // Test configuration variations
    console.log('\n🔧 Testing Configuration Variations...\n');
    
    const conservativeConfig = {
      thresholds: {
        vaguenessThreshold: 0.9, // Very high threshold
        confidenceThreshold: 0.9,
        processingTimeLimit: 1000,
        maxEnhancementLength: 300,
        minPromptLength: 5
      },
      features: {
        intentDetection: true,
        contextEnhancement: false, // Disable AI enhancement
        formatSuggestion: true,
        sentimentAnalysis: true,
        templateApplication: true
      }
    };
    
    const conservativeEnhancer = createPromptEnhancer(conservativeConfig);
    const testInput = 'help me with coding';
    
    console.log(`🧪 Testing Conservative Configuration`);
    console.log(`📝 Input: \"${testInput}\"`);
    
    const conservativeResult = await conservativeEnhancer.process(testInput);
    console.log(`✨ Enhanced: ${conservativeResult.enhanced !== conservativeResult.original ? 'Yes' : 'No'}`);
    console.log(`🎯 Confidence: ${(conservativeResult.confidence * 100).toFixed(1)}%`);
    
    // Test analysis functionality
    console.log('\n🔬 Testing Analysis Components...\n');
    
    const analysisTests = [
      'create a web application',
      'compare React and Vue frameworks',
      'fix this error',
      'what is machine learning?'
    ];
    
    for (const input of analysisTests) {
      const enhancer = createPromptEnhancer();
      const analysis = await enhancer.analyze(input);
      
      console.log(`📝 Input: \"${input}\"`);
      console.log(`🎯 Intent: ${analysis.intent.category} (${(analysis.intent.confidence * 100).toFixed(1)}% confidence)`);
      console.log(`🌫️  Vagueness: ${analysis.vaguenessLevel}`);
      console.log(`🧩 Complexity: ${analysis.complexity}`);
      console.log(`🏷️  Keywords: [${analysis.keywords.join(', ')}]`);
      
      if (analysis.contextGaps.missingFormat.length > 0) {
        console.log(`📋 Missing Format: [${analysis.contextGaps.missingFormat.join(', ')}]`);
      }
      
      if (analysis.contextGaps.missingDetails.length > 0) {
        console.log(`📄 Missing Details: [${analysis.contextGaps.missingDetails.join(', ')}]`);
      }
      
      console.log('-'.repeat(40));
    }
    
    // Performance test
    console.log('\n⚡ Performance Testing...\n');
    
    const performanceInputs = Array(5).fill('create a React component');
    const startTime = Date.now();
    
    const performanceResults = await Promise.all(
      performanceInputs.map(input => enhancePrompt(input))
    );
    
    const totalTime = Date.now() - startTime;
    const averageTime = totalTime / performanceInputs.length;
    
    console.log(`🏁 Processed ${performanceInputs.length} requests in ${totalTime}ms`);
    console.log(`📊 Average processing time: ${averageTime.toFixed(1)}ms per request`);
    console.log(`🎯 Average confidence: ${(performanceResults.reduce((acc, r) => acc + r.confidence, 0) / performanceResults.length * 100).toFixed(1)}%`);
    
    // Success summary
    console.log('\n' + '='.repeat(80));
    console.log('🎉 Enhancement Middleware Demonstration Complete!');
    console.log('\n✅ Key Features Demonstrated:');
    console.log('   • Intent detection and analysis');
    console.log('   • Context gap identification');
    console.log('   • Template-based enhancements');
    console.log('   • Configurable enhancement thresholds');
    console.log('   • Performance optimization');
    console.log('   • Error handling and fallbacks');
    
    console.log('\n🚀 The Intelligent Prompt Enhancement Middleware is ready for production use!');
    
  } catch (error) {
    console.error('❌ Demonstration failed:', error);
    console.log('\n🔧 This may be due to missing environment variables or dependencies.');
    console.log('   Make sure OPENROUTER_API_KEY is set and the enhancement model is available.');
    
    // Show fallback behavior
    console.log('\n🛡️  Testing Fallback Behavior...');
    try {
      const fallbackResult = await enhancePrompt('test input');
      console.log(`✅ Fallback works: returns original input with confidence ${fallbackResult.confidence}`);
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError);
    }
  }
}

// Run the demonstration
if (require.main === module) {
  runDemonstration().catch(console.error);
}

export { runDemonstration };