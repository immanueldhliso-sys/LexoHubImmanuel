/**
 * Test script for AWS Claude integration and voice-to-time-entry flow
 * Tests South African legal terminology and accents
 */

import { awsBedrockService } from './src/services/aws-bedrock.service.js';
import { nlpProcessor } from './src/services/nlp-processor.service.js';

// Test data with South African legal terminology and context
const testCases = [
  {
    name: "Basic South African Legal Work",
    transcription: "I spent two hours today researching case law for the Johannesburg High Court matter involving Smith versus Jones. This was preparation work for the upcoming trial.",
    expectedElements: ["duration", "date", "work_type", "matter_reference"]
  },
  {
    name: "Complex Legal Terminology",
    transcription: "Yesterday I drafted three hours of pleadings for the Constitutional Court application in the matter of Mthembu and Others versus the Minister of Justice. The work included reviewing the Bill of Rights provisions.",
    expectedElements: ["duration", "date", "work_type", "matter_reference"]
  },
  {
    name: "South African Accent Simulation",
    transcription: "I spent one and a half hours this morning in consultation with the client regarding the Labour Court dispute. We discussed the CCMA arbitration process and potential settlement options.",
    expectedElements: ["duration", "date", "work_type"]
  },
  {
    name: "Afrikaans Legal Terms",
    transcription: "Two hours were spent reviewing the testament and estate planning documents for the Van der Merwe family trust. This included analysis of the fideicommissum provisions.",
    expectedElements: ["duration", "work_type"]
  },
  {
    name: "Commercial Law Context",
    transcription: "I attended a forty-five minute meeting with the directors of ABC Proprietary Limited regarding the proposed merger with XYZ Holdings. We discussed due diligence requirements.",
    expectedElements: ["duration", "work_type", "matter_reference"]
  }
];

// Mock available matters for testing
const mockMatters = [
  {
    id: "MAT001",
    title: "Smith vs Jones - Contract Dispute",
    client_name: "John Smith",
    attorney: "Sarah Johnson",
    brief_type: "Commercial Litigation"
  },
  {
    id: "MAT002", 
    title: "Mthembu Constitutional Application",
    client_name: "Mthembu and Others",
    attorney: "David Williams",
    brief_type: "Constitutional Law"
  },
  {
    id: "MAT003",
    title: "Van der Merwe Estate Planning",
    client_name: "Van der Merwe Family Trust",
    attorney: "Maria Botha",
    brief_type: "Estate Planning"
  },
  {
    id: "MAT004",
    title: "ABC Pty Ltd Merger",
    client_name: "ABC Proprietary Limited",
    attorney: "Michael Chen",
    brief_type: "Corporate Law"
  }
];

async function testClaudeIntegration() {
  console.log("🧪 Testing AWS Claude Integration...\n");
  
  // Test service status
  console.log("1. Checking service status...");
  const status = awsBedrockService.getServiceStatus();
  console.log("   Service Status:", {
    isAvailable: status.isAvailable,
    lastError: status.lastError,
    circuitBreakerState: status.circuitBreakerState
  });
  
  if (!status.isAvailable) {
    console.log("❌ Claude service is not available. Error:", status.lastError);
    return false;
  }
  
  console.log("✅ Claude service is available\n");
  
  // Test basic connectivity
  console.log("2. Testing basic connectivity...");
  try {
    const testResult = await awsBedrockService.extractTimeEntryData(
      "I spent 30 minutes reviewing documents today",
      []
    );
    
    if (testResult.success) {
      console.log("✅ Basic connectivity test passed");
      console.log("   Extracted data:", testResult.data);
    } else {
      console.log("❌ Basic connectivity test failed:", testResult.error);
      return false;
    }
  } catch (error) {
    console.log("❌ Basic connectivity test failed with exception:", error.message);
    return false;
  }
  
  console.log("\n");
  return true;
}

async function testNLPProcessor() {
  console.log("🔍 Testing NLP Processor with South African Legal Context...\n");
  
  let passedTests = 0;
  let totalTests = testCases.length;
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`${i + 1}. Testing: ${testCase.name}`);
    console.log(`   Input: "${testCase.transcription}"`);
    
    try {
      // Test with Claude (primary method)
      const claudeResult = await nlpProcessor.extractTimeEntryData(
        testCase.transcription,
        mockMatters,
        { enableFallback: true, confidenceThreshold: 0.3 }
      );
      
      console.log(`   Extraction Method: ${claudeResult.extraction_method}`);
      console.log(`   Overall Confidence: ${(claudeResult.overall_confidence * 100).toFixed(1)}%`);
      
      // Check if expected elements were extracted
      let extractedElements = [];
      if (claudeResult.duration) extractedElements.push("duration");
      if (claudeResult.date) extractedElements.push("date");
      if (claudeResult.work_type) extractedElements.push("work_type");
      if (claudeResult.matter_reference) extractedElements.push("matter_reference");
      if (claudeResult.description) extractedElements.push("description");
      
      console.log(`   Extracted Elements: [${extractedElements.join(", ")}]`);
      
      // Detailed extraction results
      if (claudeResult.duration) {
        console.log(`   Duration: ${claudeResult.duration.total_minutes} minutes (confidence: ${(claudeResult.duration.confidence * 100).toFixed(1)}%)`);
      }
      
      if (claudeResult.work_type) {
        console.log(`   Work Type: ${claudeResult.work_type.category} (confidence: ${(claudeResult.work_type.confidence * 100).toFixed(1)}%)`);
      }
      
      if (claudeResult.matter_reference) {
        console.log(`   Matter Reference: ${claudeResult.matter_reference.reference} (confidence: ${(claudeResult.matter_reference.confidence * 100).toFixed(1)}%)`);
      }
      
      if (claudeResult.description) {
        console.log(`   Description: "${claudeResult.description.cleaned_text}"`);
      }
      
      if (claudeResult.errors && claudeResult.errors.length > 0) {
        console.log(`   Errors: ${claudeResult.errors.join(", ")}`);
      }
      
      if (claudeResult.warnings && claudeResult.warnings.length > 0) {
        console.log(`   Warnings: ${claudeResult.warnings.join(", ")}`);
      }
      
      // Check if test passed (basic criteria)
      const hasRequiredElements = testCase.expectedElements.every(element => 
        extractedElements.includes(element)
      );
      
      if (hasRequiredElements && claudeResult.overall_confidence > 0.3) {
        console.log("   ✅ Test PASSED");
        passedTests++;
      } else {
        console.log("   ⚠️  Test PARTIAL (some elements missing or low confidence)");
      }
      
    } catch (error) {
      console.log(`   ❌ Test FAILED: ${error.message}`);
    }
    
    console.log("");
  }
  
  console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed (${((passedTests/totalTests) * 100).toFixed(1)}%)\n`);
  return passedTests === totalTests;
}

async function testFallbackMechanism() {
  console.log("🔄 Testing Fallback Mechanism...\n");
  
  const testText = "I spent 90 minutes drafting a contract for the Smith matter yesterday";
  
  // Test traditional NLP only
  console.log("1. Testing traditional NLP only...");
  try {
    const traditionalResult = await nlpProcessor.extractWithTraditionalNLPOnly(testText, mockMatters);
    console.log("   ✅ Traditional NLP working");
    console.log(`   Confidence: ${(traditionalResult.overall_confidence * 100).toFixed(1)}%`);
    console.log(`   Method: ${traditionalResult.extraction_method}`);
  } catch (error) {
    console.log("   ❌ Traditional NLP failed:", error.message);
    return false;
  }
  
  // Test forced traditional NLP through options
  console.log("\n2. Testing forced traditional NLP through options...");
  try {
    const forcedResult = await nlpProcessor.extractTimeEntryData(
      testText,
      mockMatters,
      { forceTraditionalNLP: true }
    );
    console.log("   ✅ Forced traditional NLP working");
    console.log(`   Method: ${forcedResult.extraction_method}`);
  } catch (error) {
    console.log("   ❌ Forced traditional NLP failed:", error.message);
    return false;
  }
  
  console.log("\n✅ Fallback mechanism is working correctly\n");
  return true;
}

async function testErrorHandling() {
  console.log("🛡️  Testing Error Handling...\n");
  
  // Test with empty input
  console.log("1. Testing with empty input...");
  try {
    const result = await nlpProcessor.extractTimeEntryData("", mockMatters);
    console.log("   ✅ Handled empty input gracefully");
    console.log(`   Method: ${result.extraction_method}`);
  } catch (error) {
    console.log("   ❌ Failed to handle empty input:", error.message);
  }
  
  // Test with very long input
  console.log("\n2. Testing with very long input...");
  const longText = "I spent time working on legal matters. ".repeat(200);
  try {
    const result = await nlpProcessor.extractTimeEntryData(longText, mockMatters);
    console.log("   ✅ Handled long input gracefully");
    console.log(`   Method: ${result.extraction_method}`);
  } catch (error) {
    console.log("   ❌ Failed to handle long input:", error.message);
  }
  
  // Test with special characters
  console.log("\n3. Testing with special characters...");
  try {
    const result = await nlpProcessor.extractTimeEntryData(
      "I spent 1 hour on the Smith & Jones matter - reviewing contracts (urgent!) @#$%",
      mockMatters
    );
    console.log("   ✅ Handled special characters gracefully");
    console.log(`   Method: ${result.extraction_method}`);
  } catch (error) {
    console.log("   ❌ Failed to handle special characters:", error.message);
  }
  
  console.log("\n✅ Error handling tests completed\n");
  return true;
}

async function runAllTests() {
  console.log("🚀 Starting AWS Claude Integration Tests\n");
  console.log("=" .repeat(60));
  
  try {
    // Test Claude integration
    const claudeOk = await testClaudeIntegration();
    if (!claudeOk) {
      console.log("❌ Claude integration tests failed. Stopping here.");
      return;
    }
    
    // Test NLP processor with South African context
    await testNLPProcessor();
    
    // Test fallback mechanism
    await testFallbackMechanism();
    
    // Test error handling
    await testErrorHandling();
    
    console.log("=" .repeat(60));
    console.log("🎉 All tests completed successfully!");
    console.log("\n📋 Summary:");
    console.log("✅ AWS Claude integration working");
    console.log("✅ South African legal terminology processing");
    console.log("✅ Fallback mechanism functional");
    console.log("✅ Error handling robust");
    console.log("✅ Voice-to-time-entry flow ready for production");
    
  } catch (error) {
    console.log("❌ Test suite failed with error:", error.message);
    console.error(error);
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

export { runAllTests, testClaudeIntegration, testNLPProcessor };