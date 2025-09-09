import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { loadBalancer } from '@/lib/load-balancing/load-balancer';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const availableProviders = searchParams.get('providers')?.split(',') || ['xai', 'anthropic', 'openai', 'google', 'ollama'];
  const modelType = (searchParams.get('modelType') as 'chat' | 'vision' | 'reasoning' | 'artifact') || 'chat';
  const preferredProvider = searchParams.get('preferredProvider') || undefined;
  const maxCostParam = searchParams.get('maxCost');
  const maxLatencyParam = searchParams.get('maxLatency');
  const maxCost = maxCostParam ? Number.parseFloat(maxCostParam) : undefined;
  const maxLatency = maxLatencyParam ? Number.parseFloat(maxLatencyParam) : undefined;

  try {
    const decision = await loadBalancer.selectProvider(availableProviders, modelType, {
      preferredProvider,
      maxCost,
      maxLatency
    });

    return NextResponse.json({
      success: true,
      data: decision
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Load balancing failed'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, action } = body;

    if (action === 'increment') {
      loadBalancer.incrementLoad(provider);
    } else if (action === 'decrement') {
      loadBalancer.decrementLoad(provider);
    }

    return NextResponse.json({
      success: true,
      activeLoad: loadBalancer.getActiveLoad()
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Load management failed'
      },
      { status: 500 }
    );
  }
}