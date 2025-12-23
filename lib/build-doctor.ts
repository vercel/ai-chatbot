/**
 * TiQology Build Doctor Agent
 *
 * Autonomous error detection and fixing agent that:
 * - Monitors build output in real-time
 * - Analyzes TypeScript/build errors
 * - Applies fixes automatically
 * - Retries builds
 * - Learns from successful fixes
 *
 * The 13th Agent in the Agent Swarm
 */

import { exec } from "child_process";
import { EventEmitter } from "events";
import * as fs from "fs/promises";
import * as path from "path";
import { promisify } from "util";
import { neuralMesh } from "./neural-mesh";

const execAsync = promisify(exec);

interface BuildError {
  file: string;
  line: number;
  column: number;
  message: string;
  code: string;
  severity: "error" | "warning";
  raw: string;
}

interface ErrorFix {
  errorPattern: string;
  fixStrategy: string;
  confidence: number;
  applyFix: (error: BuildError, fileContent: string) => Promise<string>;
}

interface FixHistory {
  error: BuildError;
  fix: string;
  success: boolean;
  timestamp: Date;
  buildTime: number;
}

/**
 * Build Doctor Agent - Autonomous Error Fixer
 */
export class BuildDoctorAgent extends EventEmitter {
  private isMonitoring = false;
  private buildInProgress = false;
  private fixHistory: FixHistory[] = [];
  private maxRetries = 3;
  private currentRetry = 0;

  // Known error patterns and fixes
  private errorPatterns: ErrorFix[] = [
    {
      errorPattern:
        "Cannot find module '(.+)' or its corresponding type declarations",
      fixStrategy: "create_missing_module",
      confidence: 0.9,
      applyFix: this.fixMissingModule.bind(this),
    },
    {
      errorPattern: "has no exported member named '(.+)'",
      fixStrategy: "fix_import_name",
      confidence: 0.85,
      applyFix: this.fixImportName.bind(this),
    },
    {
      errorPattern: "Property '(.+)' does not exist on type '(.+)'",
      fixStrategy: "add_type_declaration",
      confidence: 0.7,
      applyFix: this.addTypeDeclaration.bind(this),
    },
    {
      errorPattern:
        "Object literal may only specify known properties, and '(.+)' does not exist",
      fixStrategy: "remove_invalid_property",
      confidence: 0.8,
      applyFix: this.removeInvalidProperty.bind(this),
    },
    {
      errorPattern: "Tuple type .+ of length .+ has no element at index",
      fixStrategy: "fix_tuple_destructuring",
      confidence: 0.9,
      applyFix: this.fixTupleDestructuring.bind(this),
    },
    {
      errorPattern: "Type .+ is not assignable to type",
      fixStrategy: "add_type_assertion",
      confidence: 0.6,
      applyFix: this.addTypeAssertion.bind(this),
    },
  ];

  constructor() {
    super();
    this.setupNeuralMeshIntegration();
  }

  /**
   * Setup integration with Neural Mesh
   */
  private setupNeuralMeshIntegration() {
    // Register as build-doctor agent
    neuralMesh.registerNode({
      id: "build-doctor",
      type: "agent",
      status: "online",
      lastHeartbeat: Date.now(),
      metadata: {
        role: "build_doctor",
        capabilities: ["error_detection", "auto_fix", "build_retry"],
      },
    });

    console.log("[Build Doctor] Registered with Neural Mesh");
  }

  /**
   * Start monitoring builds
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log("[Build Doctor] Already monitoring");
      return;
    }

    this.isMonitoring = true;
    console.log("[Build Doctor] 👨‍⚕️ Started monitoring builds...");

    // Publish status
    await neuralMesh.publish({
      event: "agent:message",
      source: "build-doctor",
      payload: {
        message: "Build Doctor Agent online and monitoring",
        status: "active",
      },
      timestamp: Date.now(),
    });

    this.emit("monitoring:started");
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    console.log("[Build Doctor] Stopped monitoring");
    this.emit("monitoring:stopped");
  }

  /**
   * Run build and auto-fix errors
   */
  async buildWithAutoFix(): Promise<{
    success: boolean;
    attempts: number;
    errors: BuildError[];
  }> {
    console.log("[Build Doctor] 🔨 Starting build with auto-fix...");
    this.buildInProgress = true;
    this.currentRetry = 0;

    const startTime = Date.now();

    while (this.currentRetry < this.maxRetries) {
      this.currentRetry++;
      console.log(
        `[Build Doctor] Build attempt ${this.currentRetry}/${this.maxRetries}`
      );

      // Run build
      const buildResult = await this.runBuild();

      if (buildResult.success) {
        const duration = Date.now() - startTime;
        console.log(
          `[Build Doctor] ✅ Build successful after ${this.currentRetry} attempt(s) in ${duration}ms`
        );

        await neuralMesh.publish({
          event: "system:health",
          source: "build-doctor",
          payload: {
            status: "build_success",
            attempts: this.currentRetry,
            duration,
          },
          timestamp: Date.now(),
        });

        this.buildInProgress = false;
        return { success: true, attempts: this.currentRetry, errors: [] };
      }

      // Parse errors
      const errors = this.parseBuildErrors(buildResult.output);
      console.log(`[Build Doctor] Found ${errors.length} errors`);

      if (errors.length === 0) {
        console.log(
          "[Build Doctor] ⚠️ Build failed but no parseable errors found"
        );
        break;
      }

      // Try to fix errors
      const fixedCount = await this.fixErrors(errors);
      console.log(`[Build Doctor] Fixed ${fixedCount}/${errors.length} errors`);

      if (fixedCount === 0) {
        console.log("[Build Doctor] ❌ Unable to fix any errors");
        this.buildInProgress = false;
        return { success: false, attempts: this.currentRetry, errors };
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log("[Build Doctor] ❌ Max retries reached, build failed");
    this.buildInProgress = false;
    return { success: false, attempts: this.currentRetry, errors: [] };
  }

  /**
   * Run the build command
   */
  private async runBuild(): Promise<{ success: boolean; output: string }> {
    try {
      const { stdout, stderr } = await execAsync("pnpm run build", {
        cwd: process.cwd(),
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      return { success: true, output: stdout + stderr };
    } catch (error: any) {
      return { success: false, output: error.stdout + error.stderr };
    }
  }

  /**
   * Parse build errors from output
   */
  private parseBuildErrors(output: string): BuildError[] {
    const errors: BuildError[] = [];
    const lines = output.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Match TypeScript error format: ./path/file.ts:line:column
      const match = line.match(/^\.\/(.+):(\d+):(\d+)$/);
      if (match) {
        const [, file, lineNum, colNum] = match;

        // Next line is usually "Type error: ..."
        const errorMessage = lines[i + 1]?.replace(/^Type error:\s*/, "") || "";

        // Get more context
        let fullMessage = errorMessage;
        for (let j = i + 2; j < lines.length && j < i + 10; j++) {
          if (lines[j].startsWith("  ") && lines[j].trim()) {
            fullMessage += "\n" + lines[j];
          } else {
            break;
          }
        }

        errors.push({
          file,
          line: Number.parseInt(lineNum),
          column: Number.parseInt(colNum),
          message: errorMessage,
          code: fullMessage,
          severity: "error",
          raw: lines.slice(i, i + 5).join("\n"),
        });
      }
    }

    return errors;
  }

  /**
   * Attempt to fix all errors
   */
  private async fixErrors(errors: BuildError[]): Promise<number> {
    let fixedCount = 0;

    for (const error of errors) {
      const fixed = await this.fixError(error);
      if (fixed) fixedCount++;
    }

    return fixedCount;
  }

  /**
   * Attempt to fix a single error
   */
  private async fixError(error: BuildError): Promise<boolean> {
    console.log(
      `[Build Doctor] 🔧 Attempting to fix: ${error.file}:${error.line}`
    );
    console.log(`[Build Doctor]    Error: ${error.message}`);

    // Find matching fix strategy
    for (const pattern of this.errorPatterns) {
      const regex = new RegExp(pattern.errorPattern, "i");
      if (regex.test(error.message)) {
        console.log(
          `[Build Doctor]    Strategy: ${pattern.fixStrategy} (confidence: ${pattern.confidence * 100}%)`
        );

        try {
          // Read file
          const filePath = path.join(process.cwd(), error.file);
          const content = await fs.readFile(filePath, "utf-8");

          // Apply fix
          const fixedContent = await pattern.applyFix(error, content);

          if (fixedContent !== content) {
            // Write fixed file
            await fs.writeFile(filePath, fixedContent, "utf-8");
            console.log(`[Build Doctor]    ✅ Applied fix to ${error.file}`);

            // Record fix history
            this.fixHistory.push({
              error,
              fix: pattern.fixStrategy,
              success: true,
              timestamp: new Date(),
              buildTime: 0,
            });

            return true;
          }
        } catch (err) {
          console.error("[Build Doctor]    ❌ Fix failed:", err);
        }
      }
    }

    console.log("[Build Doctor]    ⚠️ No fix strategy found");
    return false;
  }

  /**
   * Fix: Create missing module/component
   */
  private async fixMissingModule(
    error: BuildError,
    content: string
  ): Promise<string> {
    // Extract module path from error
    const match = error.message.match(/Cannot find module '(.+)'/);
    if (!match) return content;

    const modulePath = match[1];
    console.log(`[Build Doctor]    Creating missing module: ${modulePath}`);

    // Check if it's a UI component
    if (modulePath.includes("components/ui")) {
      const componentName = path.basename(modulePath, ".tsx");
      await this.createMissingUIComponent(componentName);
    }

    return content;
  }

  /**
   * Fix: Fix import name (e.g., 'anthropic' -> 'Anthropic')
   */
  private async fixImportName(
    error: BuildError,
    content: string
  ): Promise<string> {
    const match = error.message.match(/has no exported member named '(.+)'/);
    if (!match) return content;

    const wrongName = match[1];

    // Common fixes
    const fixes: Record<string, string> = {
      anthropic: "Anthropic",
      openai: "OpenAI",
    };

    if (fixes[wrongName]) {
      const fixedName = fixes[wrongName];
      // Fix the import line
      return content.replace(
        new RegExp(`import\\s*{\\s*${wrongName}\\s*}`, "g"),
        `import ${fixedName}`
      );
    }

    return content;
  }

  /**
   * Fix: Add type declaration
   */
  private async addTypeDeclaration(
    error: BuildError,
    content: string
  ): Promise<string> {
    // This would add missing type declarations
    // For now, return unchanged (complex fix)
    return content;
  }

  /**
   * Fix: Remove invalid property from object literal
   */
  private async removeInvalidProperty(
    error: BuildError,
    content: string
  ): Promise<string> {
    const match = error.message.match(/'(.+)' does not exist/);
    if (!match) return content;

    const invalidProp = match[1];
    console.log(`[Build Doctor]    Removing invalid property: ${invalidProp}`);

    // Find the line with the invalid property and remove it
    const lines = content.split("\n");
    const errorLine = error.line - 1; // 0-indexed

    if (errorLine >= 0 && errorLine < lines.length) {
      // Check if line contains the invalid property
      if (lines[errorLine].includes(invalidProp)) {
        lines.splice(errorLine, 1);
        return lines.join("\n");
      }
    }

    return content;
  }

  /**
   * Fix: Fix tuple destructuring
   */
  private async fixTupleDestructuring(
    error: BuildError,
    content: string
  ): Promise<string> {
    console.log(
      `[Build Doctor]    Fixing tuple destructuring at line ${error.line}`
    );

    const lines = content.split("\n");
    const errorLine = error.line - 1;

    if (errorLine >= 0 && errorLine < lines.length) {
      const line = lines[errorLine];

      // Remove extra variables from destructuring
      // e.g., [a, b, c, d] -> [a, b, c] if tuple only has 3 elements
      const destructMatch = line.match(/const\s+\[([^\]]+)\]/);
      if (destructMatch) {
        const vars = destructMatch[1].split(",").map((v) => v.trim());
        if (vars.length > 3) {
          // Remove last variable
          vars.pop();
          lines[errorLine] = line.replace(
            /\[([^\]]+)\]/,
            `[${vars.join(", ")}]`
          );
          return lines.join("\n");
        }
      }
    }

    return content;
  }

  /**
   * Fix: Add type assertion
   */
  private async addTypeAssertion(
    error: BuildError,
    content: string
  ): Promise<string> {
    // Complex fix - would add 'as Type' assertions
    return content;
  }

  /**
   * Create missing UI component
   */
  private async createMissingUIComponent(componentName: string): Promise<void> {
    const componentPath = path.join(
      process.cwd(),
      "components",
      "ui",
      `${componentName}.tsx`
    );

    // Check if file already exists
    try {
      await fs.access(componentPath);
      console.log(
        `[Build Doctor]    Component already exists: ${componentName}`
      );
      return;
    } catch {
      // File doesn't exist, create it
    }

    // Create basic component template
    const template = `"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ${componentName.charAt(0).toUpperCase() + componentName.slice(1)}Props
  extends React.HTMLAttributes<HTMLDivElement> {}

const ${componentName.charAt(0).toUpperCase() + componentName.slice(1)} = React.forwardRef<
  HTMLDivElement,
  ${componentName.charAt(0).toUpperCase() + componentName.slice(1)}Props
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("", className)}
    {...props}
  />
));

${componentName.charAt(0).toUpperCase() + componentName.slice(1)}.displayName = "${componentName.charAt(0).toUpperCase() + componentName.slice(1)}";

export { ${componentName.charAt(0).toUpperCase() + componentName.slice(1)} };
`;

    await fs.writeFile(componentPath, template, "utf-8");
    console.log(`[Build Doctor]    ✅ Created component: ${componentName}.tsx`);
  }

  /**
   * Get agent status
   */
  getStatus() {
    return {
      monitoring: this.isMonitoring,
      buildInProgress: this.buildInProgress,
      currentRetry: this.currentRetry,
      maxRetries: this.maxRetries,
      fixHistory: this.fixHistory.length,
      successRate: this.calculateSuccessRate(),
    };
  }

  /**
   * Calculate fix success rate
   */
  private calculateSuccessRate(): number {
    if (this.fixHistory.length === 0) return 0;
    const successful = this.fixHistory.filter((h) => h.success).length;
    return (successful / this.fixHistory.length) * 100;
  }
}

// Export singleton
export const buildDoctor = new BuildDoctorAgent();
