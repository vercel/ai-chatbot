"use client";

import { motion } from "framer-motion";
import {
  Activity,
  Bot,
  Brain,
  Clock,
  Eye,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CollaborativeWorkspace } from "./collaborative-workspace";
import { NeuralMemoryDashboard } from "./memory-dashboard";
import { AgentSwarmMonitor } from "./swarm-monitor";
import { AutonomousTaskManager } from "./task-manager";
import { VisionStudio } from "./vision-studio";

interface NexusStats {
  memories: number;
  imagesAnalyzed: number;
  swarmsDeployed: number;
  activeCollaborators: number;
  autonomousTasks: number;
  totalTimeSaved: number;
}

export function NexusDashboard({ userId }: { userId: string }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats] = useState<NexusStats>({
    memories: 1247,
    imagesAnalyzed: 89,
    swarmsDeployed: 34,
    activeCollaborators: 5,
    autonomousTasks: 12,
    totalTimeSaved: 156, // hours
  });

  const features = [
    {
      id: "memory",
      name: "Neural Memory",
      description: "AI remembers everything about you",
      icon: Brain,
      color: "from-purple-500 to-pink-500",
      stat: `${stats.memories} memories`,
      component: <NeuralMemoryDashboard userId={userId} />,
    },
    {
      id: "vision",
      name: "Vision Studio",
      description: "Analyze and generate images with AI",
      icon: Eye,
      color: "from-blue-500 to-cyan-500",
      stat: `${stats.imagesAnalyzed} analyzed`,
      component: <VisionStudio />,
    },
    {
      id: "swarm",
      name: "Agent Swarms",
      description: "Deploy teams of specialized AIs",
      icon: Users,
      color: "from-indigo-500 to-purple-500",
      stat: `${stats.swarmsDeployed} deployed`,
      component: <AgentSwarmMonitor />,
    },
    {
      id: "collab",
      name: "Collaboration",
      description: "Real-time editing with teammates & AI",
      icon: Zap,
      color: "from-green-500 to-emerald-500",
      stat: `${stats.activeCollaborators} active`,
      component: <CollaborativeWorkspace artifactId="demo-artifact" />,
    },
    {
      id: "autonomous",
      name: "Autonomous Tasks",
      description: "AI works 24/7 while you sleep",
      icon: Bot,
      color: "from-orange-500 to-red-500",
      stat: `${stats.autonomousTasks} running`,
      component: <AutonomousTaskManager userId={userId} />,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="sticky top-0 z-50 border-b bg-background/50 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 animate-pulse rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 opacity-50 blur-xl" />
                <div className="relative rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 p-3">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text font-bold text-3xl text-transparent">
                  TiQology Nexus
                </h1>
                <p className="text-muted-foreground">
                  The Revolutionary AI Operating System
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge
                className="border-green-200 bg-green-50 px-4 py-2 dark:bg-green-900/20"
                variant="outline"
              >
                <Activity className="mr-2 h-3 w-3 text-green-500" />
                All Systems Operational
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          <Tabs
            className="space-y-6"
            onValueChange={setActiveTab}
            value={activeTab}
          >
            <TabsList className="grid h-auto w-full grid-cols-6 p-1">
              <TabsTrigger
                className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
                value="overview"
              >
                Overview
              </TabsTrigger>
              {features.map((feature) => (
                <TabsTrigger
                  className="flex flex-col gap-1 py-3"
                  key={feature.id}
                  value={feature.id}
                >
                  <feature.icon className="h-4 w-4" />
                  <span className="hidden text-xs lg:inline">
                    {feature.name}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Overview Tab */}
            <TabsContent className="space-y-6" value="overview">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
                <Card className="bg-gradient-to-br from-purple-500 to-pink-500 p-6 text-white">
                  <div className="mb-2 flex items-center justify-between">
                    <Brain className="h-8 w-8 opacity-80" />
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div className="font-bold text-3xl">{stats.memories}</div>
                  <div className="text-sm opacity-90">Memories Stored</div>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 p-6 text-white">
                  <div className="mb-2 flex items-center justify-between">
                    <Eye className="h-8 w-8 opacity-80" />
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div className="font-bold text-3xl">
                    {stats.imagesAnalyzed}
                  </div>
                  <div className="text-sm opacity-90">Images Analyzed</div>
                </Card>

                <Card className="bg-gradient-to-br from-indigo-500 to-purple-500 p-6 text-white">
                  <div className="mb-2 flex items-center justify-between">
                    <Users className="h-8 w-8 opacity-80" />
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div className="font-bold text-3xl">
                    {stats.swarmsDeployed}
                  </div>
                  <div className="text-sm opacity-90">Swarms Deployed</div>
                </Card>

                <Card className="bg-gradient-to-br from-green-500 to-emerald-500 p-6 text-white">
                  <div className="mb-2 flex items-center justify-between">
                    <Zap className="h-8 w-8 opacity-80" />
                    <Activity className="h-4 w-4" />
                  </div>
                  <div className="font-bold text-3xl">
                    {stats.activeCollaborators}
                  </div>
                  <div className="text-sm opacity-90">Active Users</div>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500 to-red-500 p-6 text-white">
                  <div className="mb-2 flex items-center justify-between">
                    <Clock className="h-8 w-8 opacity-80" />
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div className="font-bold text-3xl">
                    {stats.totalTimeSaved}h
                  </div>
                  <div className="text-sm opacity-90">Time Saved</div>
                </Card>
              </div>

              {/* Feature Cards */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {features.map((feature, idx) => (
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    initial={{ opacity: 0, y: 20 }}
                    key={feature.id}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card
                      className="group cursor-pointer p-6 transition-all duration-300 hover:shadow-xl"
                      onClick={() => setActiveTab(feature.id)}
                    >
                      <div
                        className={`bg-gradient-to-br p-4 ${feature.color} mb-4 rounded-xl transition-transform group-hover:scale-110`}
                      >
                        <feature.icon className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="mb-2 font-bold text-xl">{feature.name}</h3>
                      <p className="mb-4 text-muted-foreground text-sm">
                        {feature.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">{feature.stat}</Badge>
                        <Button
                          className="transition-transform group-hover:translate-x-1"
                          size="sm"
                          variant="ghost"
                        >
                          Open →
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Recent Activity */}
              <Card className="p-6">
                <h3 className="mb-4 font-semibold text-lg">Recent Activity</h3>
                <div className="space-y-3">
                  {[
                    {
                      icon: Brain,
                      color: "text-purple-500",
                      text: "Neural Memory stored 12 new conversations",
                      time: "2 min ago",
                    },
                    {
                      icon: Users,
                      color: "text-indigo-500",
                      text: "Agent Swarm completed authentication system build",
                      time: "15 min ago",
                    },
                    {
                      icon: Eye,
                      color: "text-blue-500",
                      text: "Vision Studio analyzed UI screenshot and found 3 issues",
                      time: "1 hour ago",
                    },
                    {
                      icon: Bot,
                      color: "text-orange-500",
                      text: 'Autonomous Task "Deploy backend" completed successfully',
                      time: "2 hours ago",
                    },
                  ].map((activity, idx) => (
                    <motion.div
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-4 rounded-lg p-3 transition-colors hover:bg-secondary/50"
                      initial={{ opacity: 0, x: -20 }}
                      key={idx}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <div
                        className={`rounded-lg bg-secondary p-2 ${activity.color}`}
                      >
                        <activity.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{activity.text}</p>
                        <p className="mt-1 text-muted-foreground text-xs">
                          {activity.time}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>

              {/* What's New */}
              <Card className="border-purple-200 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-6 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-orange-900/20">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 p-2">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg">
                    What's New in TiQology Nexus
                  </h3>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500">✨</span>
                    <span>
                      <strong>Neural Memory:</strong> AI now remembers every
                      conversation with perfect recall
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">✨</span>
                    <span>
                      <strong>Vision Studio:</strong> Analyze UI screenshots and
                      get instant feedback
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500">✨</span>
                    <span>
                      <strong>Agent Swarms:</strong> Deploy multiple AI agents
                      working in parallel
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✨</span>
                    <span>
                      <strong>Real-time Collaboration:</strong> Edit code
                      together with AI as your teammate
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500">✨</span>
                    <span>
                      <strong>Autonomous Tasks:</strong> AI executes complex
                      workflows 24/7
                    </span>
                  </li>
                </ul>
              </Card>
            </TabsContent>

            {/* Feature Tabs */}
            {features.map((feature) => (
              <TabsContent key={feature.id} value={feature.id}>
                {feature.component}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
