/**
 * TiQology Nexus - AI Agent Swarm Orchestration
 * Deploy specialized AI agents that collaborate
 *
 * Features:
 * - Multi-agent task decomposition
 * - Parallel agent execution
 * - Agent communication protocol
 * - Real-time agent status tracking
 * - Intelligent task routing
 * - Conflict resolution
 */

import Anthropic from "@anthropic-ai/sdk";
import { EventEmitter } from "events";
import { OpenAI } from "openai";

// ============================================
// CONFIGURATION
// ============================================

const SWARM_CONFIG = {
  maxConcurrentAgents: Number.parseInt(process.env.AGENT_MAX_CONCURRENT || "5"),
  models: {
    architect: process.env.AGENT_ARCHITECT_MODEL || "gpt-4-turbo",
    coder: process.env.AGENT_CODER_MODEL || "gpt-4-turbo",
    tester: process.env.AGENT_TESTER_MODEL || "gpt-4",
    optimizer: process.env.AGENT_OPTIMIZER_MODEL || "claude-3-opus-20240229",
  },
};

// ============================================
// TYPES
// ============================================

export type AgentRole =
  | "architect"
  | "coder"
  | "tester"
  | "optimizer"
  | "researcher"
  | "designer"
  | "reviewer";

export type AgentStatus =
  | "idle"
  | "thinking"
  | "working"
  | "waiting"
  | "completed"
  | "failed";

export interface Agent {
  id: string;
  role: AgentRole;
  status: AgentStatus;
  capabilities: string[];
  currentTask?: Task;
  output?: any;
  dependencies: string[];
  startTime?: Date;
  endTime?: Date;
  model: string;
}

export interface Task {
  id: string;
  type: string;
  description: string;
  input: any;
  output?: any;
  assignedTo?: string;
  status: "pending" | "in-progress" | "completed" | "failed";
  priority: number;
  dependencies: string[];
  createdAt: Date;
  completedAt?: Date;
}

export interface SwarmRequest {
  goal: string;
  context?: Record<string, any>;
  constraints?: string[];
  preferences?: {
    speed?: "fast" | "balanced" | "thorough";
    agents?: AgentRole[];
  };
}

export interface SwarmResponse {
  success: boolean;
  result: any;
  agents: Agent[];
  tasks: Task[];
  timeline: SwarmEvent[];
  metrics: {
    totalTime: number;
    parallelism: number;
    efficiency: number;
  };
}

export interface SwarmEvent {
  timestamp: Date;
  agentId: string;
  type: "started" | "progress" | "completed" | "failed" | "communication";
  data: any;
}

export interface AgentCommunication {
  from: string;
  to: string;
  message: string;
  type: "request" | "response" | "notification";
  timestamp: Date;
}

// ============================================
// AGENT SWARM ORCHESTRATOR
// ============================================

export class AgentSwarmOrchestrator extends EventEmitter {
  private agents: Map<string, Agent> = new Map();
  private tasks: Map<string, Task> = new Map();
  private communications: AgentCommunication[] = [];
  private timeline: SwarmEvent[] = [];
  private openai: OpenAI;
  private anthropic: Anthropic;

  constructor() {
    super();
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  /**
   * Execute a goal using agent swarm
   */
  async execute(request: SwarmRequest): Promise<SwarmResponse> {
    const startTime = Date.now();

    try {
      console.log("[AgentSwarm] Starting execution for goal:", request.goal);

      // 1. Decompose goal into tasks
      const tasks = await this.decompose;
      Goal(request.goal, request.context);
      console.log(`[AgentSwarm] Decomposed into ${tasks.length} tasks`);

      // 2. Create agent team
      const agentTeam = await this.assembleTeam(
        tasks,
        request.preferences?.agents
      );
      console.log(`[AgentSwarm] Assembled team of ${agentTeam.length} agents`);

      // 3. Execute tasks with agents
      const results = await this.executeTasks(tasks, agentTeam);

      // 4. Synthesize results
      const finalResult = await this.synthesizeResults(results, request.goal);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      return {
        success: true,
        result: finalResult,
        agents: agentTeam,
        tasks: Array.from(this.tasks.values()),
        timeline: this.timeline,
        metrics: {
          totalTime,
          parallelism: this.calculateParallelism(),
          efficiency: this.calculateEfficiency(),
        },
      };
    } catch (error) {
      console.error("[AgentSwarm] Execution failed:", error);
      throw error;
    }
  }

  /**
   * Decompose goal into actionable tasks
   */
  private async decomposeGoal(
    goal: string,
    context?: Record<string, any>
  ): Promise<Task[]> {
    try {
      const prompt = `You are a task decomposition expert. Break down this goal into concrete, actionable tasks.

Goal: ${goal}

${context ? `Context: ${JSON.stringify(context, null, 2)}` : ""}

Return a JSON array of tasks with this structure:
[{
  "id": "task-1",
  "type": "architecture|coding|testing|optimization|research|design",
  "description": "detailed task description",
  "priority": 1-10,
  "dependencies": ["task-id"],
  "estimatedTime": "minutes",
  "requiredAgent": "architect|coder|tester|optimizer|researcher|designer"
}]

Make tasks specific, measurable, and executable.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      const tasksData = result.tasks || [];

      const tasks: Task[] = tasksData.map((t: any) => ({
        id: t.id,
        type: t.type,
        description: t.description,
        input: { goal, context },
        status: "pending",
        priority: t.priority || 5,
        dependencies: t.dependencies || [],
        createdAt: new Date(),
      }));

      tasks.forEach((task) => this.tasks.set(task.id, task));

      return tasks;
    } catch (error) {
      console.error("[AgentSwarm] Task decomposition failed:", error);
      throw error;
    }
  }

  /**
   * Assemble optimal team of agents
   */
  private async assembleTeam(
    tasks: Task[],
    preferredRoles?: AgentRole[]
  ): Promise<Agent[]> {
    const requiredRoles = new Set<AgentRole>();

    // Determine required agents from tasks
    tasks.forEach((task) => {
      const roleMap: Record<string, AgentRole> = {
        architecture: "architect",
        coding: "coder",
        testing: "tester",
        optimization: "optimizer",
        research: "researcher",
        design: "designer",
      };

      const role = roleMap[task.type];
      if (role) {
        requiredRoles.add(role);
      }
    });

    // Add preferred roles if specified
    preferredRoles?.forEach((role) => requiredRoles.add(role));

    // Create agents
    const agents: Agent[] = [];
    const roleCapabilities: Record<AgentRole, string[]> = {
      architect: [
        "system design",
        "architecture planning",
        "technology selection",
      ],
      coder: ["code implementation", "algorithm design", "refactoring"],
      tester: ["test case creation", "quality assurance", "bug detection"],
      optimizer: [
        "performance tuning",
        "code optimization",
        "efficiency analysis",
      ],
      researcher: ["information gathering", "best practices", "documentation"],
      designer: ["UI/UX design", "visual design", "prototyping"],
      reviewer: ["code review", "architecture review", "quality assessment"],
    };

    requiredRoles.forEach((role) => {
      const agent: Agent = {
        id: `agent-${role}-${Date.now()}`,
        role,
        status: "idle",
        capabilities: roleCapabilities[role],
        dependencies: [],
        model:
          SWARM_CONFIG.models[role as keyof typeof SWARM_CONFIG.models] ||
          "gpt-4",
      };

      agents.push(agent);
      this.agents.set(agent.id, agent);
    });

    return agents;
  }

  /**
   * Execute tasks with agents in parallel when possible
   */
  private async executeTasks(tasks: Task[], agents: Agent[]): Promise<any[]> {
    const results: any[] = [];

    // Sort tasks by dependencies (topological sort)
    const sortedTasks = this.topologicalSort(tasks);

    // Execute tasks respecting dependencies
    for (const task of sortedTasks) {
      // Find available agent for this task
      const agent = this.findBestAgent(task, agents);

      if (!agent) {
        console.warn(`[AgentSwarm] No agent available for task: ${task.id}`);
        continue;
      }

      // Execute task with agent
      task.status = "in-progress";
      task.assignedTo = agent.id;
      agent.status = "working";
      agent.currentTask = task;
      agent.startTime = new Date();

      this.emitEvent(agent.id, "started", { task: task.id });

      try {
        const result = await this.executeTaskWithAgent(task, agent);

        task.status = "completed";
        task.output = result;
        task.completedAt = new Date();
        agent.status = "completed";
        agent.output = result;
        agent.endTime = new Date();

        this.emitEvent(agent.id, "completed", {
          task: task.id,
          output: result,
        });

        results.push(result);
      } catch (error) {
        task.status = "failed";
        agent.status = "failed";

        this.emitEvent(agent.id, "failed", { task: task.id, error });

        console.error(`[AgentSwarm] Task ${task.id} failed:`, error);
      }
    }

    return results;
  }

  /**
   * Execute a single task with assigned agent
   */
  private async executeTaskWithAgent(task: Task, agent: Agent): Promise<any> {
    const systemPrompts: Record<AgentRole, string> = {
      architect: `You are a system architect. Design robust, scalable system architectures.
Your output should include component diagrams, data flow, and technology recommendations.`,
      coder: `You are an expert software engineer. Write clean, efficient, well-documented code.
Follow best practices and modern patterns. Provide complete, production-ready implementations.`,
      tester: `You are a QA engineer. Create comprehensive test cases and quality assurance plans.
Identify edge cases and potential bugs. Write thorough test suites.`,
      optimizer: `You are a performance optimization expert. Analyze code and systems for efficiency.
Suggest specific optimizations with measurable improvements.`,
      researcher: `You are a research assistant. Find relevant information, best practices, and solutions.
Provide well-sourced, accurate information with references.`,
      designer: `You are a UI/UX designer. Create user-centered designs that are beautiful and functional.
Consider accessibility, usability, and modern design principles.`,
      reviewer: `You are a code reviewer. Provide constructive feedback on code quality and architecture.
Identify potential issues and suggest improvements.`,
    };

    // Get previous task outputs if there are dependencies
    const dependencyOutputs = task.dependencies
      .map((depId) => {
        const depTask = this.tasks.get(depId);
        return depTask?.output;
      })
      .filter(Boolean);

    const taskContext = `
Task: ${task.description}
Type: ${task.type}
${dependencyOutputs.length > 0 ? `Previous outputs:\n${JSON.stringify(dependencyOutputs, null, 2)}` : ""}
${task.input?.context ? `Context:\n${JSON.stringify(task.input.context, null, 2)}` : ""}
`;

    // Execute based on agent model
    if (agent.model.startsWith("gpt")) {
      return await this.executeWithOpenAI(
        agent.model,
        systemPrompts[agent.role],
        taskContext
      );
    }
    if (agent.model.startsWith("claude")) {
      return await this.executeWithClaude(
        agent.model,
        systemPrompts[agent.role],
        taskContext
      );
    }

    throw new Error(`Unsupported model: ${agent.model}`);
  }

  private async executeWithOpenAI(
    model: string,
    systemPrompt: string,
    taskContext: string
  ): Promise<any> {
    const response = await this.openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: taskContext },
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content;
  }

  private async executeWithClaude(
    model: string,
    systemPrompt: string,
    taskContext: string
  ): Promise<any> {
    const response = await this.anthropic.messages.create({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: taskContext }],
    });

    return response.content[0].type === "text" ? response.content[0].text : "";
  }

  /**
   * Synthesize results from all agents into final output
   */
  private async synthesizeResults(results: any[], goal: string): Promise<any> {
    try {
      const prompt = `Synthesize these agent outputs into a coherent final result for the goal: "${goal}"

Agent Outputs:
${results.map((r, i) => `${i + 1}. ${JSON.stringify(r)}`).join("\n\n")}

Provide a comprehensive, structured final result that combines all agent work.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error("[AgentSwarm] Result synthesis failed:", error);
      return results;
    }
  }

  /**
   * Find best available agent for a task
   */
  private findBestAgent(task: Task, agents: Agent[]): Agent | undefined {
    const roleMap: Record<string, AgentRole> = {
      architecture: "architect",
      coding: "coder",
      testing: "tester",
      optimization: "optimizer",
      research: "researcher",
      design: "designer",
    };

    const preferredRole = roleMap[task.type];

    return agents.find(
      (agent) =>
        agent.role === preferredRole &&
        (agent.status === "idle" || agent.status === "completed")
    );
  }

  /**
   * Topological sort of tasks based on dependencies
   */
  private topologicalSort(tasks: Task[]): Task[] {
    const sorted: Task[] = [];
    const visited = new Set<string>();

    const visit = (task: Task) => {
      if (visited.has(task.id)) return;

      visited.add(task.id);

      task.dependencies.forEach((depId) => {
        const depTask = this.tasks.get(depId);
        if (depTask) visit(depTask);
      });

      sorted.push(task);
    };

    tasks.forEach(visit);

    return sorted;
  }

  /**
   * Emit swarm event
   */
  private emitEvent(
    agentId: string,
    type: SwarmEvent["type"],
    data: any
  ): void {
    const event: SwarmEvent = {
      timestamp: new Date(),
      agentId,
      type,
      data,
    };

    this.timeline.push(event);
    this.emit("event", event);
  }

  /**
   * Calculate parallelism metric
   */
  private calculateParallelism(): number {
    // Calculate average concurrent agents
    const timeline = this.timeline.filter(
      (e) => e.type === "started" || e.type === "completed"
    );

    let maxConcurrent = 0;
    let currentConcurrent = 0;

    timeline.forEach((event) => {
      if (event.type === "started") {
        currentConcurrent++;
        maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
      } else if (event.type === "completed") {
        currentConcurrent--;
      }
    });

    return maxConcurrent;
  }

  /**
   * Calculate efficiency metric
   */
  private calculateEfficiency(): number {
    const completedTasks = Array.from(this.tasks.values()).filter(
      (t) => t.status === "completed"
    );

    if (completedTasks.length === 0) return 0;

    const totalTime =
      completedTasks.reduce((sum, task) => {
        if (task.completedAt && task.createdAt) {
          return sum + (task.completedAt.getTime() - task.createdAt.getTime());
        }
        return sum;
      }, 0) / 1000; // Convert to seconds

    const averageTime = totalTime / completedTasks.length;

    // Efficiency score (lower time = higher efficiency)
    return Math.max(0, 100 - averageTime / 10);
  }

  /**
   * Get swarm status
   */
  getStatus(): {
    agents: Agent[];
    tasks: Task[];
    communications: AgentCommunication[];
  } {
    return {
      agents: Array.from(this.agents.values()),
      tasks: Array.from(this.tasks.values()),
      communications: this.communications,
    };
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let swarmOrchestrator: AgentSwarmOrchestrator | null = null;

export function getSwarmOrchestrator(): AgentSwarmOrchestrator {
  if (!swarmOrchestrator) {
    swarmOrchestrator = new AgentSwarmOrchestrator();
  }
  return swarmOrchestrator;
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

export async function deploySwarm(
  request: SwarmRequest
): Promise<SwarmResponse> {
  const orchestrator = getSwarmOrchestrator();
  return orchestrator.execute(request);
}

export function getSwarmStatus() {
  const orchestrator = getSwarmOrchestrator();
  return orchestrator.getStatus();
}
