"use client";

import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

interface Agent {
  id: string;
  role:
    | "architect"
    | "coder"
    | "tester"
    | "optimizer"
    | "researcher"
    | "designer"
    | "reviewer";
  status: "idle" | "thinking" | "working" | "completed" | "error";
  currentTask?: string;
  progress: number;
  model: string;
}

interface Task {
  id: string;
  description: string;
  status: "pending" | "in-progress" | "completed" | "blocked";
  assignedAgent?: string;
  dependencies: string[];
  result?: string;
}

interface SwarmStatus {
  swarmId: string;
  goal: string;
  agents: Agent[];
  tasks: Task[];
  overallProgress: number;
  startTime: Date;
  estimatedCompletion?: Date;
  metrics: {
    parallelism: number;
    efficiency: number;
    tasksCompleted: number;
    tasksTotal: number;
  };
}

const AGENT_COLORS = {
  architect: "from-purple-500 to-pink-500",
  coder: "from-blue-500 to-cyan-500",
  tester: "from-green-500 to-emerald-500",
  optimizer: "from-orange-500 to-red-500",
  researcher: "from-indigo-500 to-purple-500",
  designer: "from-pink-500 to-rose-500",
  reviewer: "from-yellow-500 to-orange-500",
};

const AGENT_ICONS = {
  architect: "🏗️",
  coder: "💻",
  tester: "🧪",
  optimizer: "⚡",
  researcher: "🔬",
  designer: "🎨",
  reviewer: "👀",
};

export function AgentSwarmMonitor() {
  const [goal, setGoal] = useState("");
  const [swarmStatus, setSwarmStatus] = useState<SwarmStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    if (polling && swarmStatus) {
      const interval = setInterval(() => {
        fetchSwarmStatus(swarmStatus.swarmId);
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [polling, swarmStatus]);

  const deploySwarm = async () => {
    if (!goal.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/swarm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal,
          context: {},
        }),
      });

      const data = await res.json();
      setSwarmStatus(data);
      setPolling(true);
    } catch (error) {
      console.error("Failed to deploy swarm:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSwarmStatus = async (swarmId: string) => {
    try {
      const res = await fetch(`/api/swarm?swarmId=${swarmId}`);
      const data = await res.json();
      setSwarmStatus(data);

      // Stop polling if all done
      if (data.overallProgress >= 100) {
        setPolling(false);
      }
    } catch (error) {
      console.error("Failed to fetch swarm status:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-500";
      case "working":
      case "in-progress":
        return "text-blue-500";
      case "error":
        return "text-red-500";
      case "blocked":
        return "text-yellow-500";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 p-3">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-2xl">Agent Swarm Orchestrator</h1>
            <p className="text-muted-foreground">
              Deploy teams of specialized AI agents
            </p>
          </div>
        </div>
        {swarmStatus && (
          <Badge className="px-4 py-2" variant="outline">
            {swarmStatus.metrics.tasksCompleted}/
            {swarmStatus.metrics.tasksTotal} tasks completed
          </Badge>
        )}
      </div>

      {/* Deploy New Swarm */}
      {!swarmStatus && (
        <Card className="p-6">
          <h3 className="mb-4 font-semibold text-lg">Deploy New Agent Swarm</h3>
          <div className="space-y-4">
            <Textarea
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Describe your goal... (e.g., 'Build a complete user authentication system with OAuth, password reset, and email verification')"
              rows={4}
              value={goal}
            />
            <Button
              className="w-full"
              disabled={loading || !goal.trim()}
              onClick={deploySwarm}
              size="lg"
            >
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-white border-b-2" />
                  Deploying Swarm...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Deploy Agent Swarm
                </>
              )}
            </Button>
          </div>

          <div className="mt-6 rounded-lg bg-secondary/50 p-4">
            <h4 className="mb-2 font-medium">Available Agents:</h4>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {Object.entries(AGENT_ICONS).map(([role, icon]) => (
                <div
                  className="flex items-center gap-2 rounded bg-background p-2"
                  key={role}
                >
                  <span className="text-2xl">{icon}</span>
                  <span className="text-sm capitalize">{role}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Active Swarm Status */}
      {swarmStatus && (
        <>
          {/* Overall Progress */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">
                    Goal: {swarmStatus.goal}
                  </h3>
                  <p className="mt-1 text-muted-foreground text-sm">
                    Swarm ID: {swarmStatus.swarmId}
                  </p>
                </div>
                <Button onClick={() => setSwarmStatus(null)} variant="outline">
                  New Swarm
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Overall Progress</span>
                  <span className="font-medium">
                    {Math.round(swarmStatus.overallProgress)}%
                  </span>
                </div>
                <Progress className="h-2" value={swarmStatus.overallProgress} />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 md:grid-cols-4">
                <div className="text-center">
                  <div className="font-bold text-2xl text-purple-500">
                    {swarmStatus.metrics.parallelism.toFixed(1)}x
                  </div>
                  <div className="text-muted-foreground text-xs">
                    Parallelism
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-2xl text-green-500">
                    {Math.round(swarmStatus.metrics.efficiency)}%
                  </div>
                  <div className="text-muted-foreground text-xs">
                    Efficiency
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-2xl text-blue-500">
                    {
                      swarmStatus.agents.filter((a) => a.status === "working")
                        .length
                    }
                  </div>
                  <div className="text-muted-foreground text-xs">
                    Active Agents
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-2xl text-orange-500">
                    {Math.round(
                      (Date.now() - new Date(swarmStatus.startTime).getTime()) /
                        1000
                    )}
                    s
                  </div>
                  <div className="text-muted-foreground text-xs">Elapsed</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Agents Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {swarmStatus.agents.map((agent, idx) => (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                key={agent.id}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="h-full p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-10 w-10 rounded-lg bg-gradient-to-br ${
                          AGENT_COLORS[agent.role]
                        } flex items-center justify-center text-2xl`}
                      >
                        {AGENT_ICONS[agent.role]}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium capitalize">
                          {agent.role}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {agent.model}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {agent.status === "completed" && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {agent.status === "working" && (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                      )}
                      {agent.status === "error" && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      {agent.status === "idle" && (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span
                        className={`text-sm capitalize ${getStatusColor(agent.status)}`}
                      >
                        {agent.status}
                      </span>
                    </div>

                    {agent.currentTask && (
                      <div className="line-clamp-2 text-muted-foreground text-xs">
                        {agent.currentTask}
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span>Progress</span>
                        <span>{Math.round(agent.progress)}%</span>
                      </div>
                      <Progress className="h-1" value={agent.progress} />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Task List */}
          <Card className="p-6">
            <h3 className="mb-4 font-semibold text-lg">Task Breakdown</h3>
            <div className="space-y-2">
              {swarmStatus.tasks.map((task, idx) => (
                <motion.div
                  animate={{ opacity: 1, x: 0 }}
                  className={`rounded-lg border p-3 ${
                    task.status === "completed"
                      ? "border-green-200 bg-green-50 dark:bg-green-900/20"
                      : task.status === "in-progress"
                        ? "border-blue-200 bg-blue-50 dark:bg-blue-900/20"
                        : task.status === "blocked"
                          ? "border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20"
                          : "bg-secondary/50"
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  key={task.id}
                  transition={{ delay: idx * 0.05 }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="font-mono text-muted-foreground text-xs">
                          #{idx + 1}
                        </span>
                        <Badge className="text-xs capitalize" variant="outline">
                          {task.status}
                        </Badge>
                        {task.assignedAgent && (
                          <Badge className="text-xs" variant="secondary">
                            {
                              AGENT_ICONS[
                                task.assignedAgent as keyof typeof AGENT_ICONS
                              ]
                            }{" "}
                            {task.assignedAgent}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm">{task.description}</p>
                      {task.dependencies.length > 0 && (
                        <p className="mt-1 text-muted-foreground text-xs">
                          Depends on: {task.dependencies.join(", ")}
                        </p>
                      )}
                    </div>
                    {task.status === "completed" && (
                      <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-500" />
                    )}
                  </div>
                  {task.result && (
                    <div className="mt-2 rounded bg-background p-2 text-xs">
                      <strong>Result:</strong> {task.result}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </Card>

          {/* Final Results */}
          {swarmStatus.overallProgress >= 100 && (
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 p-6 text-white"
              initial={{ opacity: 0, scale: 0.95 }}
            >
              <div className="mb-4 flex items-center gap-3">
                <CheckCircle className="h-8 w-8" />
                <div>
                  <h3 className="font-bold text-xl">Swarm Completed!</h3>
                  <p className="text-green-100">
                    All agents have finished their tasks
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="font-bold text-2xl">
                    {Math.round(swarmStatus.metrics.parallelism * 10)}x
                  </div>
                  <div className="text-green-100 text-sm">Faster than solo</div>
                </div>
                <div>
                  <div className="font-bold text-2xl">
                    {swarmStatus.metrics.tasksCompleted}
                  </div>
                  <div className="text-green-100 text-sm">Tasks completed</div>
                </div>
                <div>
                  <div className="font-bold text-2xl">
                    {Math.round(swarmStatus.metrics.efficiency)}%
                  </div>
                  <div className="text-green-100 text-sm">Efficiency</div>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
