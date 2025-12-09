"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Bot,
  CheckCircle,
  Clock,
  Mail,
  Pause,
  Play,
  Settings,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

interface TaskStep {
  id: string;
  description: string;
  status: "pending" | "in-progress" | "completed" | "failed";
  result?: string;
  timestamp?: Date;
}

interface ApprovalGate {
  stepId: string;
  reason: string;
  options: string[];
  aiRecommendation?: string;
  confidence: number;
}

interface AutonomousTask {
  id: string;
  goal: string;
  status:
    | "planning"
    | "executing"
    | "waiting-approval"
    | "completed"
    | "failed";
  progress: number;
  steps: TaskStep[];
  currentStep?: string;
  approvalGate?: ApprovalGate;
  startTime: Date;
  estimatedCompletion?: Date;
  notifications: {
    email: boolean;
    webhook: boolean;
  };
  activityLog: Array<{
    timestamp: Date;
    message: string;
    type: "info" | "success" | "warning" | "error";
  }>;
}

export function AutonomousTaskManager({ userId }: { userId: string }) {
  const [tasks, setTasks] = useState<AutonomousTask[]>([]);
  const [newGoal, setNewGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<AutonomousTask | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);

  useEffect(() => {
    loadTasks();
    const interval = setInterval(loadTasks, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    // Check if any task needs approval
    const taskNeedingApproval = tasks.find(
      (t) => t.status === "waiting-approval" && t.approvalGate
    );
    if (taskNeedingApproval) {
      setSelectedTask(taskNeedingApproval);
      setShowApprovalDialog(true);
    }
  }, [tasks]);

  const loadTasks = async () => {
    try {
      const res = await fetch(`/api/autonomous?userId=${userId}`);
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error("Failed to load tasks:", error);
    }
  };

  const createTask = async () => {
    if (!newGoal.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/autonomous", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          goal: newGoal,
          approvalThreshold: "medium",
          notifications: {
            email: true,
            webhook: false,
          },
        }),
      });

      const data = await res.json();
      setTasks([data.task, ...tasks]);
      setNewGoal("");
    } catch (error) {
      console.error("Failed to create task:", error);
    } finally {
      setLoading(false);
    }
  };

  const approveTask = async (taskId: string, decision: string) => {
    try {
      await fetch("/api/autonomous", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          action: "approve",
          decision,
        }),
      });

      setShowApprovalDialog(false);
      setSelectedTask(null);
      loadTasks();
    } catch (error) {
      console.error("Failed to approve task:", error);
    }
  };

  const cancelTask = async (taskId: string) => {
    try {
      await fetch("/api/autonomous", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          action: "cancel",
        }),
      });

      loadTasks();
    } catch (error) {
      console.error("Failed to cancel task:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "executing":
      case "planning":
        return "bg-blue-500";
      case "waiting-approval":
        return "bg-yellow-500";
      case "failed":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const activeTasks = tasks.filter((t) =>
    ["planning", "executing", "waiting-approval"].includes(t.status)
  );
  const completedTasks = tasks.filter((t) => t.status === "completed");

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-orange-500 to-red-500 p-3">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-2xl">Autonomous Task Engine</h1>
            <p className="text-muted-foreground">
              AI that works 24/7 while you sleep
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Badge className="px-4 py-2" variant="outline">
            {activeTasks.length} active
          </Badge>
          <Badge className="px-4 py-2" variant="outline">
            {completedTasks.length} completed
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/20">
              <Play className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Active Tasks</p>
              <p className="font-bold text-2xl">{activeTasks.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/20">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Completed</p>
              <p className="font-bold text-2xl">{completedTasks.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-yellow-100 p-2 dark:bg-yellow-900/20">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Awaiting Approval</p>
              <p className="font-bold text-2xl">
                {tasks.filter((t) => t.status === "waiting-approval").length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/20">
              <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Success Rate</p>
              <p className="font-bold text-2xl">
                {tasks.length > 0
                  ? Math.round((completedTasks.length / tasks.length) * 100)
                  : 0}
                %
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Create New Task */}
      <Card className="p-6">
        <h3 className="mb-4 font-semibold text-lg">Create Autonomous Task</h3>
        <div className="space-y-4">
          <Textarea
            onChange={(e) => setNewGoal(e.target.value)}
            placeholder="Describe what you want AI to accomplish autonomously... (e.g., 'Research and create a comprehensive report on quantum computing applications in AI, including code examples and references')"
            rows={4}
            value={newGoal}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-muted-foreground text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>Email notifications: On</span>
              </div>
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Approval threshold: Medium</span>
              </div>
            </div>
            <Button
              disabled={loading || !newGoal.trim()}
              onClick={createTask}
              size="lg"
            >
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-white border-b-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Start Autonomous Task
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Active Tasks */}
      {activeTasks.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Active Tasks</h3>
          {activeTasks.map((task, idx) => (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              key={task.id}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="p-6">
                <div className="space-y-4">
                  {/* Task Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <Badge
                          className={`${getStatusColor(task.status)} text-white capitalize`}
                        >
                          {task.status.replace("-", " ")}
                        </Badge>
                        <span className="text-muted-foreground text-xs">
                          Started {new Date(task.startTime).toLocaleString()}
                        </span>
                      </div>
                      <h4 className="mb-1 font-medium">{task.goal}</h4>
                      {task.currentStep && (
                        <p className="text-muted-foreground text-sm">
                          Current: {task.currentStep}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() => cancelTask(task.id)}
                      size="sm"
                      variant="ghost"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span>{Math.round(task.progress)}%</span>
                    </div>
                    <Progress className="h-2" value={task.progress} />
                  </div>

                  {/* Steps */}
                  <div className="space-y-2">
                    {task.steps.slice(0, 5).map((step, stepIdx) => (
                      <div
                        className="flex items-center gap-3 rounded p-2 hover:bg-secondary/50"
                        key={step.id}
                      >
                        <div className="flex-shrink-0">
                          {step.status === "completed" && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          {step.status === "in-progress" && (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                          )}
                          {step.status === "failed" && (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          {step.status === "pending" && (
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 text-sm">
                          <span
                            className={
                              step.status === "completed"
                                ? "text-muted-foreground line-through"
                                : ""
                            }
                          >
                            {step.description}
                          </span>
                          {step.result && (
                            <p className="mt-1 text-muted-foreground text-xs">
                              {step.result}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    {task.steps.length > 5 && (
                      <p className="text-center text-muted-foreground text-xs">
                        +{task.steps.length - 5} more steps...
                      </p>
                    )}
                  </div>

                  {/* Activity Log Preview */}
                  {task.activityLog.length > 0 && (
                    <div className="border-t pt-2">
                      <p className="mb-2 text-muted-foreground text-xs">
                        Recent Activity:
                      </p>
                      <div className="space-y-1">
                        {task.activityLog.slice(-3).map((log, logIdx) => (
                          <div
                            className="flex items-start gap-2 text-xs"
                            key={logIdx}
                          >
                            <span className="text-muted-foreground">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                            <span
                              className={
                                log.type === "error"
                                  ? "text-red-500"
                                  : log.type === "success"
                                    ? "text-green-500"
                                    : log.type === "warning"
                                      ? "text-yellow-500"
                                      : ""
                              }
                            >
                              {log.message}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Completed Tasks</h3>
          <div className="space-y-2">
            {completedTasks.slice(0, 3).map((task) => (
              <Card
                className="bg-green-50 p-4 dark:bg-green-900/20"
                key={task.id}
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div className="flex-1">
                    <p className="font-medium">{task.goal}</p>
                    <p className="text-muted-foreground text-xs">
                      Completed {new Date(task.startTime).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className="text-green-600" variant="outline">
                    {task.steps.length} steps
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Approval Dialog */}
      <Dialog onOpenChange={setShowApprovalDialog} open={showApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approval Required</DialogTitle>
            <DialogDescription>
              The AI needs your approval to proceed with this action.
            </DialogDescription>
          </DialogHeader>

          {selectedTask?.approvalGate && (
            <div className="space-y-4">
              <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
                <p className="mb-2 font-medium text-sm">Reason:</p>
                <p className="text-sm">{selectedTask.approvalGate.reason}</p>
              </div>

              {selectedTask.approvalGate.aiRecommendation && (
                <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                  <p className="mb-2 font-medium text-sm">AI Recommendation:</p>
                  <p className="text-sm">
                    {selectedTask.approvalGate.aiRecommendation}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">
                      Confidence:
                    </span>
                    <Progress
                      className="h-1.5 flex-1"
                      value={selectedTask.approvalGate.confidence * 100}
                    />
                    <span className="font-medium text-xs">
                      {Math.round(selectedTask.approvalGate.confidence * 100)}%
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <p className="font-medium text-sm">Choose an option:</p>
                {selectedTask.approvalGate.options.map((option) => (
                  <Button
                    className="w-full justify-start"
                    key={option}
                    onClick={() => approveTask(selectedTask.id, option)}
                    variant="outline"
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => setShowApprovalDialog(false)}
              variant="ghost"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
