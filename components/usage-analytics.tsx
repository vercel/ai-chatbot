"use client";

import {
  BarChart3,
  Calendar,
  ChevronDown,
  DollarSign,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ENHANCED_MODEL_CATALOG, estimateCost } from "@/lib/ai/enhanced-models";
import { getIconComponent } from "@/lib/ai/icon-utils";

interface UsageData {
  modelId: string;
  requests: number;
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
  avgResponseTime: number;
  successRate: number;
}

interface AnalyticsStat {
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
}

// Mock data - in production, this would come from your API
const MOCK_USAGE_DATA: UsageData[] = [
  {
    modelId: "chat-model",
    requests: 1234,
    inputTokens: 456_789,
    outputTokens: 234_567,
    totalCost: 12.45,
    avgResponseTime: 1.2,
    successRate: 99.8,
  },
  {
    modelId: "chat-model-reasoning",
    requests: 567,
    inputTokens: 234_567,
    outputTokens: 123_456,
    totalCost: 45.67,
    avgResponseTime: 2.5,
    successRate: 99.5,
  },
  {
    modelId: "gpt-4o",
    requests: 345,
    inputTokens: 123_456,
    outputTokens: 89_012,
    totalCost: 89.12,
    avgResponseTime: 2.1,
    successRate: 99.9,
  },
  {
    modelId: "claude-3-5-sonnet",
    requests: 234,
    inputTokens: 98_765,
    outputTokens: 65_432,
    totalCost: 67.89,
    avgResponseTime: 2.3,
    successRate: 99.7,
  },
];

export function UsageAnalytics() {
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d" | "all">(
    "7d"
  );
  const [selectedTab, setSelectedTab] = useState("overview");

  // Calculate totals
  const totals = useMemo(() => {
    const totalRequests = MOCK_USAGE_DATA.reduce(
      (sum, d) => sum + d.requests,
      0
    );
    const totalInputTokens = MOCK_USAGE_DATA.reduce(
      (sum, d) => sum + d.inputTokens,
      0
    );
    const totalOutputTokens = MOCK_USAGE_DATA.reduce(
      (sum, d) => sum + d.outputTokens,
      0
    );
    const totalCost = MOCK_USAGE_DATA.reduce((sum, d) => sum + d.totalCost, 0);
    const avgResponseTime =
      MOCK_USAGE_DATA.reduce(
        (sum, d) => sum + d.avgResponseTime * d.requests,
        0
      ) / totalRequests;

    return {
      requests: totalRequests,
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      totalTokens: totalInputTokens + totalOutputTokens,
      cost: totalCost,
      avgResponseTime,
    };
  }, []);

  const stats: AnalyticsStat[] = [
    {
      label: "Total Requests",
      value: totals.requests.toLocaleString(),
      change: "+12.5%",
      changeType: "positive",
      icon: <Zap className="h-4 w-4" />,
    },
    {
      label: "Total Cost",
      value: `$${totals.cost.toFixed(2)}`,
      change: "+8.3%",
      changeType: "negative",
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      label: "Total Tokens",
      value: (totals.totalTokens / 1000).toFixed(1) + "K",
      change: "+15.2%",
      changeType: "positive",
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      label: "Avg Response Time",
      value: `${totals.avgResponseTime.toFixed(2)}s`,
      change: "-5.1%",
      changeType: "positive",
      icon: <TrendingUp className="h-4 w-4" />,
    },
  ];

  // Sort models by usage
  const sortedByRequests = [...MOCK_USAGE_DATA].sort(
    (a, b) => b.requests - a.requests
  );
  const sortedByCost = [...MOCK_USAGE_DATA].sort(
    (a, b) => b.totalCost - a.totalCost
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          <h2 className="font-semibold text-lg">Usage Analytics</h2>
        </div>
        <Select onValueChange={(v) => setTimeRange(v as any)} value={timeRange}>
          <SelectTrigger className="w-[140px]">
            <Calendar className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-6 p-4">
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="font-medium text-sm">
                    {stat.label}
                  </CardTitle>
                  {stat.icon}
                </CardHeader>
                <CardContent>
                  <div className="font-bold text-2xl">{stat.value}</div>
                  {stat.change && (
                    <p
                      className={`text-xs ${
                        stat.changeType === "positive"
                          ? "text-green-600 dark:text-green-400"
                          : stat.changeType === "negative"
                            ? "text-red-600 dark:text-red-400"
                            : "text-muted-foreground"
                      }`}
                    >
                      {stat.change} from last period
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabs */}
          <Tabs onValueChange={setSelectedTab} value={selectedTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="models">By Model</TabsTrigger>
              <TabsTrigger value="costs">Costs</TabsTrigger>
            </TabsList>

            <TabsContent className="mt-4 space-y-4" value="overview">
              {/* Top Models by Requests */}
              <Card>
                <CardHeader>
                  <CardTitle>Most Used Models</CardTitle>
                  <CardDescription>
                    Ranked by number of requests
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sortedByRequests.map((data, index) => {
                    const model = ENHANCED_MODEL_CATALOG.find(
                      (m) => m.id === data.modelId
                    );
                    const percentage = (data.requests / totals.requests) * 100;

                    return (
                      <div className="space-y-2" key={data.modelId}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge
                              className="h-6 w-6 justify-center p-0"
                              variant="outline"
                            >
                              {index + 1}
                            </Badge>
                            {getIconComponent(model?.iconType)}
                            <span className="font-medium text-sm">
                              {model?.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-muted-foreground text-sm">
                            <span>
                              {data.requests.toLocaleString()} requests
                            </span>
                            <span className="font-medium">
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <Progress className="h-2" value={percentage} />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>
                    Success rate and response times
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {MOCK_USAGE_DATA.map((data) => {
                    const model = ENHANCED_MODEL_CATALOG.find(
                      (m) => m.id === data.modelId
                    );

                    return (
                      <div
                        className="flex items-center justify-between py-2"
                        key={data.modelId}
                      >
                        <div className="flex flex-1 items-center gap-2">
                          {getIconComponent(model?.iconType)}
                          <span className="font-medium text-sm">
                            {model?.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-right">
                            <div className="text-muted-foreground text-xs">
                              Success Rate
                            </div>
                            <div className="font-medium">
                              {data.successRate}%
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-muted-foreground text-xs">
                              Avg Time
                            </div>
                            <div className="font-medium">
                              {data.avgResponseTime.toFixed(2)}s
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent className="mt-4 space-y-4" value="models">
              {MOCK_USAGE_DATA.map((data) => {
                const model = ENHANCED_MODEL_CATALOG.find(
                  (m) => m.id === data.modelId
                );
                const totalTokens = data.inputTokens + data.outputTokens;

                return (
                  <Card key={data.modelId}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getIconComponent(model?.iconType)}
                          <CardTitle className="text-base">
                            {model?.name}
                          </CardTitle>
                        </div>
                        <Badge variant="secondary">
                          {data.requests} requests
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div>
                          <div className="text-muted-foreground text-xs">
                            Input Tokens
                          </div>
                          <div className="font-semibold text-lg">
                            {(data.inputTokens / 1000).toFixed(1)}K
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs">
                            Output Tokens
                          </div>
                          <div className="font-semibold text-lg">
                            {(data.outputTokens / 1000).toFixed(1)}K
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs">
                            Total Cost
                          </div>
                          <div className="font-semibold text-lg">
                            ${data.totalCost.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs">
                            Avg Time
                          </div>
                          <div className="font-semibold text-lg">
                            {data.avgResponseTime.toFixed(2)}s
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            <TabsContent className="mt-4 space-y-4" value="costs">
              {/* Cost Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Cost Breakdown by Model</CardTitle>
                  <CardDescription>Total spend ranked by model</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sortedByCost.map((data, index) => {
                    const model = ENHANCED_MODEL_CATALOG.find(
                      (m) => m.id === data.modelId
                    );
                    const percentage = (data.totalCost / totals.cost) * 100;

                    return (
                      <div className="space-y-2" key={data.modelId}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge
                              className="h-6 w-6 justify-center p-0"
                              variant="outline"
                            >
                              {index + 1}
                            </Badge>
                            {getIconComponent(model?.iconType)}
                            <span className="font-medium text-sm">
                              {model?.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-muted-foreground">
                              ${data.totalCost.toFixed(2)}
                            </span>
                            <span className="font-medium">
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <Progress className="h-2" value={percentage} />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Cost per Request */}
              <Card>
                <CardHeader>
                  <CardTitle>Cost Efficiency</CardTitle>
                  <CardDescription>Average cost per request</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {MOCK_USAGE_DATA.map((data) => {
                    const model = ENHANCED_MODEL_CATALOG.find(
                      (m) => m.id === data.modelId
                    );
                    const costPerRequest = data.totalCost / data.requests;

                    return (
                      <div
                        className="flex items-center justify-between py-2"
                        key={data.modelId}
                      >
                        <div className="flex items-center gap-2">
                          {getIconComponent(model?.iconType)}
                          <span className="font-medium text-sm">
                            {model?.name}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            ${costPerRequest.toFixed(4)}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            per request
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}
