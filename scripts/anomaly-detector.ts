/**
 * TiQology Anomaly Detector
 *
 * AI-powered pipeline anomaly detection system
 * Analyzes historical data and detects performance regressions
 */

interface WorkflowRun {
  conclusion: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  workflowName: string;
  databaseId: number;
}

interface AnomalyResult {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  value: number;
  message: string;
  recommendation: string;
  confidence: number;
  timestamp: string;
}

interface PerformanceBaseline {
  avgBuildTime: number;
  avgFailureRate: number;
  avgSuccessRate: number;
  stdDevBuildTime: number;
}

export class AnomalyDetector {
  private baseline: PerformanceBaseline | null = null;
  private historicalData: WorkflowRun[] = [];

  constructor() {
    this.loadBaseline();
  }

  /**
   * Load or calculate performance baseline
   */
  private loadBaseline(): void {
    // In production, load from database or cache
    // For now, initialize with defaults
    this.baseline = {
      avgBuildTime: 180, // 3 minutes in seconds
      avgFailureRate: 5, // 5%
      avgSuccessRate: 95, // 95%
      stdDevBuildTime: 30, // 30 seconds
    };
  }

  /**
   * Analyze workflow runs and detect anomalies
   */
  public async detectAnomalies(runs: WorkflowRun[]): Promise<AnomalyResult[]> {
    this.historicalData = runs;
    const anomalies: AnomalyResult[] = [];

    // Detection algorithms
    anomalies.push(...this.detectFailureRateAnomaly(runs));
    anomalies.push(...this.detectBuildTimeRegression(runs));
    anomalies.push(...this.detectFlappingTests(runs));
    anomalies.push(...this.detectDeploymentFrequencyAnomaly(runs));

    return anomalies.filter((a) => a !== null);
  }

  /**
   * Detect abnormal failure rates
   */
  private detectFailureRateAnomaly(runs: WorkflowRun[]): AnomalyResult[] {
    const anomalies: AnomalyResult[] = [];

    // Recent failure rate (last 20 runs)
    const recentRuns = runs.slice(0, 20);
    const recentFailures = recentRuns.filter(
      (r) => r.conclusion === "failure"
    ).length;
    const recentFailureRate = (recentFailures / recentRuns.length) * 100;

    // Historical failure rate (runs 20-50)
    const historicalRuns = runs.slice(20, 50);
    const historicalFailures = historicalRuns.filter(
      (r) => r.conclusion === "failure"
    ).length;
    const historicalFailureRate =
      (historicalFailures / historicalRuns.length) * 100;

    // Calculate percentage increase
    const increasePercentage =
      ((recentFailureRate - historicalFailureRate) / historicalFailureRate) *
      100;

    if (recentFailureRate > 20) {
      anomalies.push({
        type: "high_failure_rate",
        severity: "critical",
        value: recentFailureRate,
        message: `Failure rate is ${recentFailureRate.toFixed(2)}%, exceeding 20% threshold`,
        recommendation:
          "Investigate recent changes and consider rollback. Review failed job logs.",
        confidence: 0.95,
        timestamp: new Date().toISOString(),
      });
    } else if (increasePercentage > 50 && recentFailureRate > 10) {
      anomalies.push({
        type: "failure_rate_spike",
        severity: "high",
        value: increasePercentage,
        message: `Failure rate increased by ${increasePercentage.toFixed(2)}% compared to baseline`,
        recommendation:
          "Review recent commits for potential issues. Check for flaky tests.",
        confidence: 0.85,
        timestamp: new Date().toISOString(),
      });
    }

    return anomalies;
  }

  /**
   * Detect build time regressions
   */
  private detectBuildTimeRegression(runs: WorkflowRun[]): AnomalyResult[] {
    const anomalies: AnomalyResult[] = [];

    // Calculate average build times
    const recentBuildTimes = runs.slice(0, 10).map((r) => {
      const start = new Date(r.createdAt).getTime();
      const end = new Date(r.updatedAt).getTime();
      return (end - start) / 1000; // Convert to seconds
    });

    const avgRecentBuildTime =
      recentBuildTimes.reduce((a, b) => a + b, 0) / recentBuildTimes.length;

    // Compare against baseline
    if (
      this.baseline &&
      avgRecentBuildTime > this.baseline.avgBuildTime * 1.2
    ) {
      const increasePercentage =
        ((avgRecentBuildTime - this.baseline.avgBuildTime) /
          this.baseline.avgBuildTime) *
        100;

      anomalies.push({
        type: "build_time_regression",
        severity: increasePercentage > 50 ? "high" : "medium",
        value: avgRecentBuildTime,
        message: `Build time increased by ${increasePercentage.toFixed(2)}% (${avgRecentBuildTime.toFixed(0)}s vs ${this.baseline.avgBuildTime}s baseline)`,
        recommendation:
          "Check for new dependencies, unoptimized code, or infrastructure issues. Consider cache optimization.",
        confidence: 0.8,
        timestamp: new Date().toISOString(),
      });
    }

    return anomalies;
  }

  /**
   * Detect flapping/flaky tests
   */
  private detectFlappingTests(runs: WorkflowRun[]): AnomalyResult[] {
    const anomalies: AnomalyResult[] = [];

    // Group consecutive runs by workflow name
    const workflowGroups: { [key: string]: string[] } = {};

    runs.slice(0, 20).forEach((run) => {
      if (!workflowGroups[run.workflowName]) {
        workflowGroups[run.workflowName] = [];
      }
      workflowGroups[run.workflowName].push(run.conclusion);
    });

    // Detect flapping (alternating success/failure)
    Object.entries(workflowGroups).forEach(([workflow, conclusions]) => {
      let flappingCount = 0;

      for (let i = 1; i < conclusions.length; i++) {
        if (conclusions[i] !== conclusions[i - 1]) {
          flappingCount++;
        }
      }

      const flappingRate = flappingCount / conclusions.length;

      if (flappingRate > 0.4) {
        anomalies.push({
          type: "flapping_tests",
          severity: "medium",
          value: flappingRate * 100,
          message: `Workflow "${workflow}" showing flaky behavior (${(flappingRate * 100).toFixed(0)}% inconsistency)`,
          recommendation:
            "Identify and fix flaky tests. Consider adding retries or improving test isolation.",
          confidence: 0.75,
          timestamp: new Date().toISOString(),
        });
      }
    });

    return anomalies;
  }

  /**
   * Detect unusual deployment frequency patterns
   */
  private detectDeploymentFrequencyAnomaly(
    runs: WorkflowRun[]
  ): AnomalyResult[] {
    const anomalies: AnomalyResult[] = [];

    // Count deployments in last 24 hours
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentDeployments = runs.filter(
      (r) => new Date(r.createdAt) > oneDayAgo
    ).length;

    // Too many deployments might indicate issues
    if (recentDeployments > 20) {
      anomalies.push({
        type: "high_deployment_frequency",
        severity: "medium",
        value: recentDeployments,
        message: `Unusually high deployment frequency: ${recentDeployments} deployments in 24 hours`,
        recommendation:
          "Check if multiple hotfixes are being deployed. Consider batching changes or investigating root cause.",
        confidence: 0.7,
        timestamp: new Date().toISOString(),
      });
    }

    // Too few deployments might indicate blocked pipeline
    if (recentDeployments === 0) {
      anomalies.push({
        type: "no_recent_deployments",
        severity: "low",
        value: 0,
        message: "No deployments in the last 24 hours",
        recommendation:
          "Verify if this is intentional. Check for blocked PRs or pipeline issues.",
        confidence: 0.6,
        timestamp: new Date().toISOString(),
      });
    }

    return anomalies;
  }

  /**
   * Update baseline based on recent performance
   */
  public updateBaseline(runs: WorkflowRun[]): void {
    if (runs.length < 30) return;

    const successfulRuns = runs.filter((r) => r.conclusion === "success");

    // Calculate new baseline metrics
    const buildTimes = successfulRuns.map((r) => {
      const start = new Date(r.createdAt).getTime();
      const end = new Date(r.updatedAt).getTime();
      return (end - start) / 1000;
    });

    const avgBuildTime =
      buildTimes.reduce((a, b) => a + b, 0) / buildTimes.length;
    const variance =
      buildTimes.reduce((sum, time) => sum + (time - avgBuildTime) ** 2, 0) /
      buildTimes.length;
    const stdDevBuildTime = Math.sqrt(variance);

    const failureRate =
      ((runs.length - successfulRuns.length) / runs.length) * 100;

    this.baseline = {
      avgBuildTime,
      avgFailureRate: failureRate,
      avgSuccessRate: 100 - failureRate,
      stdDevBuildTime,
    };

    // In production, persist to database
    console.log("Baseline updated:", this.baseline);
  }

  /**
   * Get current performance baseline
   */
  public getBaseline(): PerformanceBaseline | null {
    return this.baseline;
  }
}

// Export singleton instance
export const anomalyDetector = new AnomalyDetector();
