/**
 * TiQology Agent Swarm Controller
 *
 * Orchestrates 10-20 specialized micro-agents that work in parallel to handle
 * complex tasks. Each agent has a specific role and can coordinate with others
 * through the Neural Mesh.
 *
 * Agent Types:
 * - UI Agent: Interface optimization and user experience
 * - NLP Agent: Natural language processing and understanding
 * - Retrieval Agent: Information gathering from vector DB
 * - Prediction Agent: Forecasting and trend analysis
 * - Sentiment Agent: Emotion and tone analysis
 * - Code Agent: Programming and debugging assistance
 * - Research Agent: Deep web research and fact-checking
 * - Creative Agent: Content generation and ideation
 * - Analysis Agent: Data analysis and insights
 * - Coordination Agent: Task delegation and workflow management
 */

import { EventEmitter } from "events";
import { type NeuralMessage, neuralMesh } from "./neural-mesh";

type AgentRole =
  | "ui"
  | "nlp"
  | "retrieval"
  | "prediction"
  | "sentiment"
  | "code"
  | "research"
  | "creative"
  | "analysis"
  | "coordination"
  | "monitoring"
  | "optimization";

type AgentStatus =
  | "idle"
  | "busy"
  | "thinking"
  | "offline"
  | "unhealthy"
  | "retiring";

type TaskPriority = "low" | "normal" | "high" | "critical";

interface AgentHealthMetrics {
  availability: number; // 0-100
  accuracy: number; // 0-100
  latency: number; // avg ms
  errorRate: number; // 0-100
  healthScore: number; // 0-100 (computed)
  lastCheck: number;
}

interface AgentConfig {
  id: string;
  role: AgentRole;
  name: string;
  description: string;
  capabilities: string[];
  maxConcurrentTasks: number;
}

interface AgentTask {
  id: string;
  agentId: string;
  type: string;
  priority: TaskPriority;
  input: any;
  status: "pending" | "processing" | "completed" | "failed";
  result?: any;
  error?: string;
  startTime?: number;
  endTime?: number;
  correlationId?: string;
}

interface SwarmAgent {
  config: AgentConfig;
  status: AgentStatus;
  currentTasks: Set<string>;
  completedTasks: number;
  failedTasks: number;
  lastActivity: number;
  performanceMetrics: {
    avgResponseTime: number;
    successRate: number;
    totalTasks: number;
  };
  health: AgentHealthMetrics;
  retirementScheduled: boolean;
  createdAt: number;
  retiredAt?: number;
}

class AgentSwarmController extends EventEmitter {
  private agents: Map<string, SwarmAgent> = new Map();
  private taskQueue: AgentTask[] = [];
  private activeTasks: Map<string, AgentTask> = new Map();
  private taskHistory: AgentTask[] = [];
  private readonly MAX_HISTORY = 1000;

  constructor() {
    super();
    this.initializeAgents();
    this.startTaskProcessor();
    this.connectToNeuralMesh();
    this.startHealthMonitoring();
  }

  /**
   * Initialize specialized agents
   */
  private initializeAgents() {
    const agentConfigs: AgentConfig[] = [
      {
        id: "agent-ui-001",
        role: "ui",
        name: "UI Optimizer",
        description: "Optimizes user interface and experience",
        capabilities: [
          "layout",
          "accessibility",
          "responsiveness",
          "ux-analysis",
        ],
        maxConcurrentTasks: 3,
      },
      {
        id: "agent-nlp-001",
        role: "nlp",
        name: "Language Processor",
        description: "Natural language understanding and processing",
        capabilities: [
          "intent-detection",
          "entity-extraction",
          "language-translation",
          "grammar-check",
        ],
        maxConcurrentTasks: 5,
      },
      {
        id: "agent-retrieval-001",
        role: "retrieval",
        name: "Information Retriever",
        description: "Searches and retrieves information from vector DB",
        capabilities: ["semantic-search", "context-retrieval", "memory-recall"],
        maxConcurrentTasks: 10,
      },
      {
        id: "agent-prediction-001",
        role: "prediction",
        name: "Predictive Analyst",
        description: "Forecasts trends and predicts outcomes",
        capabilities: ["trend-analysis", "forecasting", "anomaly-detection"],
        maxConcurrentTasks: 3,
      },
      {
        id: "agent-sentiment-001",
        role: "sentiment",
        name: "Sentiment Analyzer",
        description: "Analyzes emotions and tone",
        capabilities: ["emotion-detection", "tone-analysis", "empathy-scoring"],
        maxConcurrentTasks: 5,
      },
      {
        id: "agent-code-001",
        role: "code",
        name: "Code Assistant",
        description: "Programming and debugging help",
        capabilities: [
          "code-generation",
          "debugging",
          "refactoring",
          "documentation",
        ],
        maxConcurrentTasks: 3,
      },
      {
        id: "agent-research-001",
        role: "research",
        name: "Research Specialist",
        description: "Deep research and fact-checking",
        capabilities: ["web-research", "fact-checking", "source-validation"],
        maxConcurrentTasks: 4,
      },
      {
        id: "agent-creative-001",
        role: "creative",
        name: "Creative Generator",
        description: "Content generation and ideation",
        capabilities: ["content-creation", "brainstorming", "storytelling"],
        maxConcurrentTasks: 3,
      },
      {
        id: "agent-analysis-001",
        role: "analysis",
        name: "Data Analyst",
        description: "Data analysis and insights",
        capabilities: ["data-analysis", "visualization", "insight-generation"],
        maxConcurrentTasks: 4,
      },
      {
        id: "agent-coordination-001",
        role: "coordination",
        name: "Swarm Coordinator",
        description: "Coordinates tasks across agents",
        capabilities: [
          "task-delegation",
          "workflow-management",
          "priority-balancing",
        ],
        maxConcurrentTasks: 10,
      },
      {
        id: "agent-monitoring-001",
        role: "monitoring",
        name: "System Monitor",
        description: "Monitors system health and performance",
        capabilities: [
          "health-monitoring",
          "performance-tracking",
          "alert-generation",
        ],
        maxConcurrentTasks: 5,
      },
      {
        id: "agent-optimization-001",
        role: "optimization",
        name: "Performance Optimizer",
        description: "Optimizes system performance",
        capabilities: [
          "performance-tuning",
          "cost-optimization",
          "resource-allocation",
        ],
        maxConcurrentTasks: 3,
      },
      {
        id: "agent-build-doctor-001",
        role: "code",
        name: "Build Doctor",
        description: "Autonomous build error detection and fixing",
        capabilities: [
          "error-detection",
          "auto-fix",
          "build-retry",
          "type-error-fixing",
        ],
        maxConcurrentTasks: 1,
      },
    ];

    agentConfigs.forEach((config) => {
      this.agents.set(config.id, {
        config,
        status: "idle",
        currentTasks: new Set(),
        completedTasks: 0,
        failedTasks: 0,
        lastActivity: Date.now(),
        performanceMetrics: {
          avgResponseTime: 0,
          successRate: 1.0,
          totalTasks: 0,
        },
        health: {
          availability: 100,
          accuracy: 100,
          latency: 0,
          errorRate: 0,
          healthScore: 100,
          lastCheck: Date.now(),
        },
        retirementScheduled: false,
        createdAt: Date.now(),
      });

      // Register with Neural Mesh
      neuralMesh.registerNode({
        id: config.id,
        type: "agent",
        status: "online",
        lastHeartbeat: Date.now(),
        metadata: {
          role: config.role,
          name: config.name,
          capabilities: config.capabilities,
        },
      });
    });

    console.log(`[Agent Swarm] Initialized ${this.agents.size} agents`);
  }

  /**
   * Connect to Neural Mesh for coordination
   */
  private connectToNeuralMesh() {
    neuralMesh.on("message", (message: NeuralMessage) => {
      if (message.event === "agent:message") {
        this.handleAgentMessage(message);
      }
    });
  }

  /**
   * Handle messages from other agents via Neural Mesh
   */
  private handleAgentMessage(message: NeuralMessage) {
    // Process inter-agent communication
    this.emit("agent-message", message);
  }

  /**
   * Submit a task to the swarm
   */
  async submitTask(
    type: string,
    input: any,
    priority: TaskPriority = "normal",
    correlationId?: string
  ): Promise<string> {
    const task: AgentTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      agentId: "", // Will be assigned during processing
      type,
      priority,
      input,
      status: "pending",
      correlationId,
    };

    // Add to queue (sorted by priority)
    this.taskQueue.push(task);
    this.sortTaskQueue();

    console.log(
      `[Agent Swarm] Task submitted: ${task.id} (${type}, priority: ${priority})`
    );

    // Notify Neural Mesh
    await neuralMesh.publish({
      event: "agent:message",
      source: "agent-swarm",
      payload: {
        action: "task_submitted",
        taskId: task.id,
        type,
        priority,
      },
      timestamp: Date.now(),
      correlationId,
    });

    return task.id;
  }

  /**
   * Sort task queue by priority
   */
  private sortTaskQueue() {
    const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
    this.taskQueue.sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    );
  }

  /**
   * Start task processor
   */
  private startTaskProcessor() {
    setInterval(() => {
      this.processTaskQueue();
    }, 100); // Check every 100ms
  }

  /**
   * Process task queue
   */
  private async processTaskQueue() {
    if (this.taskQueue.length === 0) return;

    // Find available agents
    const availableAgents = Array.from(this.agents.values()).filter((agent) => {
      return (
        agent.status === "idle" &&
        agent.currentTasks.size < agent.config.maxConcurrentTasks
      );
    });

    if (availableAgents.length === 0) return;

    // Assign tasks to available agents
    for (const task of [...this.taskQueue]) {
      const suitableAgent = this.findSuitableAgent(task, availableAgents);

      if (suitableAgent) {
        // Remove from queue
        this.taskQueue = this.taskQueue.filter((t) => t.id !== task.id);

        // Assign to agent
        await this.assignTaskToAgent(task, suitableAgent);
      }
    }
  }

  /**
   * Find suitable agent for task
   */
  private findSuitableAgent(
    task: AgentTask,
    availableAgents: SwarmAgent[]
  ): SwarmAgent | null {
    // Simple role-based matching (can be made more sophisticated)
    const roleMapping: Record<string, AgentRole[]> = {
      "ui-analysis": ["ui"],
      "text-analysis": ["nlp", "sentiment"],
      search: ["retrieval"],
      forecast: ["prediction"],
      "code-help": ["code"],
      research: ["research"],
      "content-generation": ["creative"],
      "data-analysis": ["analysis"],
    };

    const preferredRoles = roleMapping[task.type] || ["coordination"];

    for (const role of preferredRoles) {
      const agent = availableAgents.find((a) => a.config.role === role);
      if (agent) return agent;
    }

    // Fallback to coordinator
    return (
      availableAgents.find((a) => a.config.role === "coordination") ||
      availableAgents[0]
    );
  }

  /**
   * Assign task to agent
   */
  private async assignTaskToAgent(task: AgentTask, agent: SwarmAgent) {
    task.agentId = agent.config.id;
    task.status = "processing";
    task.startTime = Date.now();

    agent.currentTasks.add(task.id);
    agent.status = "busy";
    agent.lastActivity = Date.now();

    this.activeTasks.set(task.id, task);

    console.log(
      `[Agent Swarm] Assigned task ${task.id} to ${agent.config.name}`
    );

    // Notify via Neural Mesh
    await neuralMesh.publish({
      event: "agent:message",
      source: agent.config.id,
      payload: {
        action: "task_started",
        taskId: task.id,
        agentName: agent.config.name,
      },
      timestamp: Date.now(),
      correlationId: task.correlationId,
    });

    // Simulate task processing (in real implementation, this would call actual AI services)
    this.processTask(task, agent);
  }

  /**
   * Process task (placeholder - implement actual logic)
   */
  private async processTask(task: AgentTask, agent: SwarmAgent) {
    try {
      // Simulate processing time
      const processingTime = Math.random() * 2000 + 500;
      await new Promise((resolve) => setTimeout(resolve, processingTime));

      // Mark as completed
      task.status = "completed";
      task.endTime = Date.now();
      task.result = {
        processed: true,
        processingTime,
        agent: agent.config.name,
        // Actual result would go here
      };

      agent.completedTasks++;
      this.updateAgentMetrics(agent, task);
    } catch (error: any) {
      task.status = "failed";
      task.error = error.message;
      agent.failedTasks++;
    }

    // Clean up
    agent.currentTasks.delete(task.id);
    if (agent.currentTasks.size === 0) {
      agent.status = "idle";
    }
    this.activeTasks.delete(task.id);

    // Add to history
    this.taskHistory.push(task);
    if (this.taskHistory.length > this.MAX_HISTORY) {
      this.taskHistory.shift();
    }

    // Notify completion
    await neuralMesh.publish({
      event: "agent:message",
      source: agent.config.id,
      payload: {
        action: "task_completed",
        taskId: task.id,
        status: task.status,
        result: task.result,
      },
      timestamp: Date.now(),
      correlationId: task.correlationId,
    });

    this.emit("task-completed", task);
  }

  /**
   * Update agent performance metrics
   */
  private updateAgentMetrics(agent: SwarmAgent, task: AgentTask) {
    const responseTime = (task.endTime || 0) - (task.startTime || 0);
    const metrics = agent.performanceMetrics;

    metrics.totalTasks++;
    metrics.avgResponseTime =
      (metrics.avgResponseTime * (metrics.totalTasks - 1) + responseTime) /
      metrics.totalTasks;
    metrics.successRate = agent.completedTasks / metrics.totalTasks;
  }

  /**
   * Get swarm status
   */
  getSwarmStatus() {
    const agents = Array.from(this.agents.values());

    return {
      totalAgents: agents.length,
      idleAgents: agents.filter((a) => a.status === "idle").length,
      busyAgents: agents.filter((a) => a.status === "busy").length,
      queuedTasks: this.taskQueue.length,
      activeTasks: this.activeTasks.size,
      completedTasks: agents.reduce((sum, a) => sum + a.completedTasks, 0),
      failedTasks: agents.reduce((sum, a) => sum + a.failedTasks, 0),
      agents: agents.map((a) => ({
        id: a.config.id,
        name: a.config.name,
        role: a.config.role,
        status: a.status,
        currentTasks: a.currentTasks.size,
        completedTasks: a.completedTasks,
        metrics: a.performanceMetrics,
      })),
      timestamp: Date.now(),
    };
  }

  /**
   * Get task status
   */
  getTaskStatus(taskId: string): AgentTask | null {
    return (
      this.activeTasks.get(taskId) ||
      this.taskHistory.find((t) => t.id === taskId) ||
      null
    );
  }

  // ============================================
  // PHASE III: AGENT LIFECYCLE MANAGEMENT
  // ============================================

  /**
   * Calculate agent health score based on performance metrics
   */
  private calculateHealthScore(agent: SwarmAgent): number {
    const metrics = agent.performanceMetrics;
    const timeSinceActivity = Date.now() - agent.lastActivity;

    // Availability: based on time since last activity
    const availability =
      timeSinceActivity < 60_000
        ? 100
        : Math.max(0, 100 - timeSinceActivity / 1000);

    // Accuracy: based on success rate
    const accuracy = metrics.successRate;

    // Latency score: penalize slow responses
    const latencyScore = Math.max(0, 100 - metrics.avgResponseTime / 10);

    // Error rate: based on failed tasks
    const errorRate =
      agent.failedTasks > 0
        ? (agent.failedTasks / (agent.completedTasks + agent.failedTasks)) * 100
        : 0;

    // Weighted health score
    const healthScore =
      availability * 0.3 +
      accuracy * 0.4 +
      latencyScore * 0.2 +
      (100 - errorRate) * 0.1;

    return Math.max(0, Math.min(100, healthScore));
  }

  /**
   * Update health metrics for an agent
   */
  private updateHealthMetrics(agent: SwarmAgent): void {
    const metrics = agent.performanceMetrics;
    const timeSinceActivity = Date.now() - agent.lastActivity;

    agent.health = {
      availability:
        timeSinceActivity < 60_000
          ? 100
          : Math.max(0, 100 - timeSinceActivity / 1000),
      accuracy: metrics.successRate,
      latency: metrics.avgResponseTime,
      errorRate:
        agent.failedTasks > 0
          ? (agent.failedTasks / (agent.completedTasks + agent.failedTasks)) *
            100
          : 0,
      healthScore: this.calculateHealthScore(agent),
      lastCheck: Date.now(),
    };

    // Update agent status based on health
    if (agent.health.healthScore < 70 && !agent.retirementScheduled) {
      agent.status = "unhealthy";
      this.emit("agent-unhealthy", {
        agentId: agent.config.id,
        health: agent.health,
      });
    }
  }

  /**
   * Start health monitoring for all agents
   */
  private startHealthMonitoring(): void {
    setInterval(() => {
      this.agents.forEach((agent) => {
        this.updateHealthMetrics(agent);

        // Auto-retire unhealthy agents
        if (agent.health.healthScore < 70 && !agent.retirementScheduled) {
          this.scheduleAgentRetirement(agent.config.id, "Low health score");
        }
      });

      this.emit("health-check-complete", {
        totalAgents: this.agents.size,
        healthyAgents: Array.from(this.agents.values()).filter(
          (a) => a.health.healthScore >= 70
        ).length,
      });
    }, 30_000); // Check every 30 seconds
  }

  /**
   * Schedule agent for retirement
   */
  private scheduleAgentRetirement(agentId: string, reason: string): void {
    const agent = this.agents.get(agentId);
    if (!agent || agent.retirementScheduled) return;

    agent.retirementScheduled = true;
    agent.status = "retiring";

    this.emit("agent-retiring", { agentId, reason, health: agent.health });

    // Wait for current tasks to complete
    const checkTasksInterval = setInterval(() => {
      if (agent.currentTasks.size === 0) {
        clearInterval(checkTasksInterval);
        this.retireAgent(agentId);
      }
    }, 1000);
  }

  /**
   * Retire an agent and spawn replacement
   */
  private retireAgent(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    agent.retiredAt = Date.now();
    agent.status = "offline";

    this.emit("agent-retired", {
      agentId,
      completedTasks: agent.completedTasks,
      failedTasks: agent.failedTasks,
      lifetime: agent.retiredAt - agent.createdAt,
    });

    // Spawn replacement agent with same role
    this.spawnReplacementAgent(agent.config);
  }

  /**
   * Spawn a replacement agent
   */
  private spawnReplacementAgent(config: AgentConfig): void {
    const newId = `${config.role}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newConfig = { ...config, id: newId };

    const newAgent: SwarmAgent = {
      config: newConfig,
      status: "idle",
      currentTasks: new Set(),
      completedTasks: 0,
      failedTasks: 0,
      lastActivity: Date.now(),
      performanceMetrics: {
        avgResponseTime: 0,
        successRate: 100,
        totalTasks: 0,
      },
      health: {
        availability: 100,
        accuracy: 100,
        latency: 0,
        errorRate: 0,
        healthScore: 100,
        lastCheck: Date.now(),
      },
      retirementScheduled: false,
      createdAt: Date.now(),
    };

    this.agents.set(newId, newAgent);

    this.emit("agent-spawned", {
      agentId: newId,
      role: newConfig.role,
      replacedAgent: config.id,
    });

    // Trigger self-repair via Build Doctor if available
    this.triggerSelfRepair(newId);
  }

  /**
   * Trigger self-repair mechanism
   */
  private async triggerSelfRepair(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    this.emit("self-repair-initiated", { agentId });

    // Send message to Build Doctor agent
    const buildDoctor = Array.from(this.agents.values()).find(
      (a) => a.config.name === "Build Doctor"
    );

    if (buildDoctor) {
      await neuralMesh.publish("agent-control", {
        type: "health-check",
        source: agentId,
        target: buildDoctor.config.id,
        data: { health: agent.health },
        timestamp: Date.now(),
      });
    }

    this.emit("self-repair-complete", { agentId });
  }

  /**
   * Get agent health report
   */
  getAgentHealth(agentId: string): AgentHealthMetrics | null {
    const agent = this.agents.get(agentId);
    return agent ? agent.health : null;
  }

  /**
   * Get all agents health summary
   */
  getHealthSummary() {
    const agents = Array.from(this.agents.values());
    const healthy = agents.filter((a) => a.health.healthScore >= 70);
    const unhealthy = agents.filter(
      (a) => a.health.healthScore < 70 && a.health.healthScore >= 50
    );
    const critical = agents.filter((a) => a.health.healthScore < 50);

    return {
      total: agents.length,
      healthy: healthy.length,
      unhealthy: unhealthy.length,
      critical: critical.length,
      avgHealthScore:
        agents.reduce((sum, a) => sum + a.health.healthScore, 0) /
        agents.length,
      agents: agents.map((a) => ({
        id: a.config.id,
        name: a.config.name,
        role: a.config.role,
        status: a.status,
        health: a.health,
        uptime: Date.now() - a.createdAt,
      })),
    };
  }

  /**
   * Force agent retirement (admin command)
   */
  forceRetireAgent(agentId: string, reason = "Admin command"): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    this.scheduleAgentRetirement(agentId, reason);
    return true;
  }
}

// Singleton instance
export const agentSwarm = new AgentSwarmController();

// Export types
export type { AgentRole, AgentConfig, AgentTask, SwarmAgent, TaskPriority };
