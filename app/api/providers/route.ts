import { NextResponse } from 'next/server';
import { getProvidersConfig } from '@/lib/ai/providers';

export async function GET() {
  try {
    const config = getProvidersConfig();
    
    const response = {
      providers: {
        openai: config.openai.enabled,
        anthropic: config.anthropic.enabled,
        google: config.google.enabled,
      }
    };
    
    // Debug logging for provider API
    if (process.env.NODE_ENV === 'development') {
      console.log('\n🌐 Provider API Response:');
      console.log('📡 Providers status:', response.providers);
    }
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to get provider config:', error);
    return NextResponse.json(
      { error: 'Failed to get provider configuration' },
      { status: 500 }
    );
  }
}