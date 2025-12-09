#!/usr/bin/env node

/**
 * AgentOS v1.0 - Validation Test Script
 *
 * Tests the agent router with sample tasks to verify functionality
 *
 * Usage:
 *   node scripts/test-agentos.js
 *
 * Environment:
 *   AGENTOS_API_KEY - Optional API key for testing auth
 *   AGENTOS_ENDPOINT - Optional custom endpoint (default: http://localhost:3000)
 */

const ENDPOINT = process.env.AGENTOS_ENDPOINT || "http://localhost:3000";
const API_KEY = process.env.AGENTOS_API_KEY;

// Test configuration
const tests = [
  {
    name: "Ghost Evaluation - Basic",
    task: {
      id: "test_ghost_basic",
      origin: "test-script",
      targetAgents: ["ghost-evaluator"],
      domain: "general",
      kind: "evaluation",
      priority: "normal",
      payload: {
        prompt:
          'Evaluate the quality of this statement: "TiQology is building the future of legal tech."',
        model: "chat-model",
      },
    },
    expectedStatus: "completed",
  },
  {
    name: "Best Interest Engine - Family Law",
    task: {
      id: "test_best_interest",
      origin: "test-script",
      targetAgents: ["best-interest-engine"],
      domain: "family-law",
      kind: "evaluation",
      priority: "high",
      payload: {
        parentingPlan:
          "Joint legal custody with Mother having primary physical custody. Father has weekend visitation every other weekend and Wednesday evenings.",
        communication:
          "Parents communicate via email weekly to coordinate schedules. Tone is generally respectful with occasional delays in responses.",
        incidents:
          "No documented safety incidents in the past 12 months. One missed pickup due to traffic, immediately communicated.",
        childProfile:
          "8-year-old boy, well-adjusted in school, enjoys sports. Strong relationship with both parents. No special needs.",
        model: "chat-model",
      },
    },
    expectedStatus: "completed",
  },
  {
    name: "Devin Builder - Build Task",
    task: {
      id: "test_devin_builder",
      origin: "test-script",
      targetAgents: ["devin-builder"],
      domain: "dev-ops",
      kind: "build",
      priority: "high",
      payload: {
        description: "Add user profile page with edit functionality",
        requirements: [
          "Display user information (name, email, avatar)",
          "Allow editing of profile fields",
          "Save changes to database",
          "Add profile picture upload",
        ],
        context: "TiQology user management feature",
        targetRepo: "TiQology-spa",
        priority: "high",
      },
    },
    expectedStatus: "completed",
  },
  {
    name: "Rocket Ops - Deployment",
    task: {
      id: "test_rocket_ops",
      origin: "test-script",
      targetAgents: ["rocket-ops"],
      domain: "dev-ops",
      kind: "ops",
      priority: "high",
      payload: {
        action: "deploy",
        target: "TiQology-spa-production",
        parameters: {
          branch: "main",
          environment: "production",
          autoRollback: true,
        },
      },
    },
    expectedStatus: "completed",
  },
  {
    name: "Invalid Task - Missing Payload",
    task: {
      id: "test_invalid",
      origin: "test-script",
      targetAgents: ["ghost-evaluator"],
      domain: "general",
      kind: "evaluation",
      priority: "normal",
      // Missing payload
    },
    expectedStatus: "failed",
    expectedError: "AGENTOS_VALIDATION_ERROR",
  },
  {
    name: "Invalid Agent - Non-existent",
    task: {
      id: "test_no_agent",
      origin: "test-script",
      targetAgents: ["non-existent-agent"],
      domain: "general",
      kind: "evaluation",
      priority: "normal",
      payload: {
        prompt: "Test prompt",
      },
    },
    expectedStatus: "failed",
    expectedError: "AGENTOS_AGENT_NOT_FOUND",
  },
];

// Color output helpers
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Run a single test
async function runTest(test) {
  log(`\n${"=".repeat(60)}`, "cyan");
  log(`TEST: ${test.name}`, "cyan");
  log("=".repeat(60), "cyan");

  try {
    const headers = {
      "Content-Type": "application/json",
    };

    if (API_KEY) {
      headers["x-api-key"] = API_KEY;
    }

    log("Sending request...", "blue");
    const startTime = Date.now();

    const response = await fetch(`${ENDPOINT}/api/agent-router`, {
      method: "POST",
      headers,
      body: JSON.stringify({ task: test.task }),
    });

    const duration = Date.now() - startTime;
    const result = await response.json();

    log(`Response received in ${duration}ms`, "blue");
    log("\nResponse:", "blue");
    console.log(JSON.stringify(result, null, 2));

    // Validate result
    const actualStatus = result.status || (result.error ? "failed" : "unknown");
    const passed = actualStatus === test.expectedStatus;

    if (test.expectedError && result.error) {
      const errorMatches = result.error.code === test.expectedError;
      if (errorMatches) {
        log(`\n✅ PASSED - Error code matches: ${test.expectedError}`, "green");
        return { name: test.name, passed: true, duration };
      }
      log(
        `\n❌ FAILED - Expected error: ${test.expectedError}, got: ${result.error.code}`,
        "red"
      );
      return { name: test.name, passed: false, duration };
    }

    if (passed) {
      log(`\n✅ PASSED - Status: ${actualStatus}`, "green");

      // Display key results
      if (result.result?.data) {
        log("\nKey Results:", "yellow");
        const data = result.result.data;

        if (data.score !== undefined) {
          log(`  Score: ${data.score}`, "yellow");
        }
        if (data.overall !== undefined) {
          log(`  Overall: ${data.overall}`, "yellow");
          log(`  Stability: ${data.stability}`, "yellow");
          log(`  Safety: ${data.safety}`, "yellow");
          log(`  Cooperation: ${data.cooperation}`, "yellow");
          log(`  Emotional Impact: ${data.emotionalImpact}`, "yellow");
        }
        if (data.taskTemplate) {
          log(
            `  Task Template: Generated (${data.taskTemplate.length} chars)`,
            "yellow"
          );
        }
        if (data.playbook) {
          log(
            `  Playbook: Generated (${data.playbook.length} chars)`,
            "yellow"
          );
        }
      }

      // Display trace
      if (result.trace) {
        log(`\nExecution Trace (${result.trace.totalDuration}ms):`, "yellow");
        result.trace.steps.forEach((step) => {
          const durationStr = step.duration ? ` (${step.duration}ms)` : "";
          log(`  ${step.agent} -> ${step.action}${durationStr}`, "yellow");
        });
      }

      return { name: test.name, passed: true, duration };
    }
    log(
      `\n❌ FAILED - Expected: ${test.expectedStatus}, got: ${actualStatus}`,
      "red"
    );
    return { name: test.name, passed: false, duration };
  } catch (error) {
    log(`\n❌ FAILED - Error: ${error.message}`, "red");
    console.error(error);
    return { name: test.name, passed: false, error: error.message };
  }
}

// Health check
async function healthCheck() {
  log("\n" + "=".repeat(60), "cyan");
  log("HEALTH CHECK", "cyan");
  log("=".repeat(60), "cyan");

  try {
    const response = await fetch(`${ENDPOINT}/api/agent-router`);
    const result = await response.json();

    if (result.status === "healthy") {
      log("✅ Service is healthy", "green");
      log(`Version: ${result.version}`, "blue");
      log(`Available Agents: ${result.availableAgents.join(", ")}`, "blue");
      return true;
    }
    log("❌ Service unhealthy", "red");
    return false;
  } catch (error) {
    log(`❌ Health check failed: ${error.message}`, "red");
    return false;
  }
}

// Main execution
async function main() {
  log("\n" + "█".repeat(60), "cyan");
  log("  AgentOS v1.0 - Validation Test Suite", "cyan");
  log("█".repeat(60) + "\n", "cyan");

  log(`Endpoint: ${ENDPOINT}`, "blue");
  log(`API Key: ${API_KEY ? "✓ Configured" : "✗ Not configured"}\n`, "blue");

  // Health check
  const healthy = await healthCheck();
  if (!healthy) {
    log("\n⚠️  Service not healthy. Some tests may fail.\n", "yellow");
  }

  // Run all tests
  const results = [];
  for (const test of tests) {
    const result = await runTest(test);
    results.push(result);
  }

  // Summary
  log("\n" + "=".repeat(60), "cyan");
  log("TEST SUMMARY", "cyan");
  log("=".repeat(60), "cyan");

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  results.forEach((result) => {
    const icon = result.passed ? "✅" : "❌";
    const durationStr = result.duration ? ` (${result.duration}ms)` : "";
    log(
      `${icon} ${result.name}${durationStr}`,
      result.passed ? "green" : "red"
    );
  });

  log(`\nTotal: ${total} | Passed: ${passed} | Failed: ${failed}`, "blue");

  if (failed === 0) {
    log("\n🎉 All tests passed!", "green");
  } else {
    log(`\n⚠️  ${failed} test(s) failed`, "red");
  }

  process.exit(failed === 0 ? 0 : 1);
}

// Run
main().catch((error) => {
  log(`Fatal error: ${error.message}`, "red");
  console.error(error);
  process.exit(1);
});
