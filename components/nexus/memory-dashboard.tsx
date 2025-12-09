"use client";

import { motion } from "framer-motion";
import { Brain, Clock, Network, Search, TrendingUp, User } from "lucide-react";
import { useEffect, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Memory {
  id: string;
  content: string;
  timestamp: Date;
  category: string;
  confidence: number;
}

interface KnowledgeNode {
  id: string;
  label: string;
  type: "user" | "topic" | "project" | "decision";
  connections: number;
}

interface UserProfile {
  expertise: string[];
  projects: string[];
  preferences: Record<string, any>;
  conversationCount: number;
  lastActive: Date;
}

export function NeuralMemoryDashboard({ userId }: { userId: string }) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [graphData, setGraphData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMemoryData();
  }, [userId]);

  const loadMemoryData = async () => {
    try {
      // Fetch user memories
      const memoriesRes = await fetch(
        `/api/memory?userId=${userId}&action=recall`
      );
      const memoriesData = await memoriesRes.json();
      setMemories(memoriesData.memories || []);

      // Fetch user profile
      const profileRes = await fetch(
        `/api/memory?userId=${userId}&action=profile`
      );
      const profileData = await profileRes.json();
      setProfile(profileData.profile);

      // Fetch knowledge graph
      const graphRes = await fetch(`/api/memory?userId=${userId}&action=graph`);
      const graphData = await graphRes.json();
      setGraphData(graphData);

      setLoading(false);
    } catch (error) {
      console.error("Failed to load memory data:", error);
      setLoading(false);
    }
  };

  const filteredMemories = memories.filter(
    (m) =>
      m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mock activity data for chart
  const activityData = Array.from({ length: 7 }, (_, i) => ({
    day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i],
    conversations: Math.floor(Math.random() * 20) + 5,
  }));

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-primary border-b-2" />
          <p className="text-muted-foreground">Loading neural memory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 p-3">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-2xl">Neural Memory</h1>
            <p className="text-muted-foreground">
              AI's complete knowledge about you
            </p>
          </div>
        </div>
        <Badge className="px-4 py-2" variant="outline">
          {memories.length} memories stored
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/20">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Conversations</p>
              <p className="font-bold text-2xl">
                {profile?.conversationCount || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/20">
              <User className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Expertise Areas</p>
              <p className="font-bold text-2xl">
                {profile?.expertise?.length || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/20">
              <Network className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Projects</p>
              <p className="font-bold text-2xl">
                {profile?.projects?.length || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-100 p-2 dark:bg-orange-900/20">
              <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Memory Growth</p>
              <p className="font-bold text-2xl">+24%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs className="space-y-4" defaultValue="memories">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="memories">Memories</TabsTrigger>
          <TabsTrigger value="graph">Knowledge Graph</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Memories Tab */}
        <TabsContent className="space-y-4" value="memories">
          <div className="relative">
            <Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memories..."
              value={searchQuery}
            />
          </div>

          <div className="space-y-3">
            {filteredMemories.map((memory, idx) => (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                key={memory.id}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="p-4 transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm">{memory.content}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge className="text-xs" variant="secondary">
                          {memory.category}
                        </Badge>
                        <span className="text-muted-foreground text-xs">
                          {new Date(memory.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-16 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${memory.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {Math.round(memory.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Knowledge Graph Tab */}
        <TabsContent value="graph">
          <Card className="p-4">
            <div className="h-[500px] rounded-lg border bg-secondary/10">
              {graphData ? (
                <ForceGraph2D
                  backgroundColor="transparent"
                  graphData={graphData}
                  linkDirectionalParticleSpeed={0.005}
                  linkDirectionalParticles={2}
                  nodeAutoColorBy="type"
                  nodeLabel="label"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Building knowledge graph...
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent className="space-y-4" value="profile">
          <Card className="p-6">
            <h3 className="mb-4 font-semibold text-lg">Expertise</h3>
            <div className="flex flex-wrap gap-2">
              {profile?.expertise?.map((skill) => (
                <Badge className="px-3 py-1" key={skill} variant="outline">
                  {skill}
                </Badge>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 font-semibold text-lg">Active Projects</h3>
            <div className="space-y-2">
              {profile?.projects?.map((project) => (
                <div
                  className="flex items-center gap-2 rounded p-2 hover:bg-secondary/50"
                  key={project}
                >
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span>{project}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 font-semibold text-lg">Preferences</h3>
            <div className="space-y-2 text-sm">
              {Object.entries(profile?.preferences || {}).map(
                ([key, value]) => (
                  <div
                    className="flex items-center justify-between rounded p-2 hover:bg-secondary/50"
                    key={key}
                  >
                    <span className="text-muted-foreground capitalize">
                      {key.replace(/_/g, " ")}
                    </span>
                    <span className="font-medium">{String(value)}</span>
                  </div>
                )
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent className="space-y-4" value="insights">
          <Card className="p-6">
            <h3 className="mb-4 font-semibold text-lg">Activity Trend</h3>
            <ResponsiveContainer height={300} width="100%">
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="colorConv" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Area
                  dataKey="conversations"
                  fill="url(#colorConv)"
                  fillOpacity={1}
                  stroke="#8b5cf6"
                  type="monotone"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 font-semibold text-lg">AI Insights</h3>
            <div className="space-y-3">
              <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                <p className="text-sm">
                  <span className="font-semibold">Pattern Detected:</span>{" "}
                  You're most active on weekdays between 9 AM - 5 PM, focusing
                  on AI development and system architecture.
                </p>
              </div>
              <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
                <p className="text-sm">
                  <span className="font-semibold">Learning Trend:</span> Your
                  expertise in AI agent orchestration has grown 40% this month
                  based on conversation depth.
                </p>
              </div>
              <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                <p className="text-sm">
                  <span className="font-semibold">Recommendation:</span> Based
                  on your interests, consider exploring quantum computing
                  integration with AI systems.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
