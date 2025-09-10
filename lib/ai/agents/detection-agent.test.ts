import { describe, it, expect } from 'vitest';
import { DetectionAgent } from './detection-agent';
import type { AgentExecutionContext } from '../tools/types';

describe('DetectionAgent', () => {
  it('should generate snapshot and inferences', async () => {
    const agent = new DetectionAgent();
    const ctx: AgentExecutionContext = {
      agentId: 'test',
      userId: 'u1',
      sessionId: 's1',
      currentPhase: 'detection',
      availableTools: [],
      conversationHistory: [
        { id: 'm1', role: 'user', content: '-23.56, -46.63', timestamp: new Date() },
      ],
    };

    const res = await agent.processRequest(ctx);
    const data = res.response.data;
    expect(data.stage).toBe('detection');
    expect(data.site.snapshots.length).toBeGreaterThan(0);
    expect(data.site.detected_panels).toBeDefined();
    expect(data.site.roof_mask).toBeDefined();
    expect(data.actions.length).toBeGreaterThan(0);
  });
});
