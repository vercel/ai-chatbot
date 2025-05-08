import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { openai } from '@ai-sdk/openai';
import { xai } from '@ai-sdk/xai';
import { ChatModel, ImageModel } from '@/lib/ai/models';

// Cache the result for 1 hour
export const revalidate = 3600;

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Fetch available models from OpenAI
    let openaiModels: ChatModel[] = [];
    let xaiModels: ChatModel[] = [];
    let error = null;

    try {
      // We'd typically fetch models from the API, but since that requires additional
      // configuration, we'll use our predefined models for now
      openaiModels = [
        {
          id: 'openai-gpt4o',
          name: 'GPT-4o',
          description: 'Advanced vision-capable model',
          provider: 'openai',
          modelId: 'gpt-4o',
        },
        {
          id: 'openai-o3mini',
          name: 'O3-mini',
          description: 'Fast STEM reasoning model',
          provider: 'openai',
          modelId: 'o3-mini', 
        },
        {
          id: 'openai-reasoning',
          name: 'GPT-4o Reasoning',
          description: 'Advanced reasoning capabilities',
          provider: 'openai',
          modelId: 'gpt-4o',
        },
      ];

      xaiModels = [
        {
          id: 'xai-grok2',
          name: 'Grok-2',
          description: 'General purpose chat model',
          provider: 'xai',
          modelId: 'grok-2-1212',
        },
        {
          id: 'xai-grok2-vision',
          name: 'Grok-2 Vision',
          description: 'Vision-capable model',
          provider: 'xai',
          modelId: 'grok-2-vision-1212',
        },
        {
          id: 'xai-grok3-mini',
          name: 'Grok-3 Mini',
          description: 'Compact reasoning model',
          provider: 'xai',
          modelId: 'grok-3-mini-beta',
        },
      ];
      
      // For a production app, we'd fetch the models dynamically:
      // In a real implementation, you'd use the SDK to fetch available models
      // const openaiModelsResponse = await fetch('https://api.openai.com/v1/models', {
      //   headers: {
      //     'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      //   }
      // });
      // 
      // if (!openaiModelsResponse.ok) {
      //   throw new Error(`OpenAI API responded with ${openaiModelsResponse.status}`);
      // }
      // 
      // const openaiData = await openaiModelsResponse.json();
      // openaiModels = openaiData.data
      //   .filter(model => model.id.startsWith('gpt'))
      //   .map(model => ({
      //     id: `openai-${model.id}`,
      //     name: model.id,
      //     description: '',
      //     provider: 'openai',
      //     modelId: model.id
      //   }));
    } catch (err: any) {
      console.error('Error fetching models:', err);
      error = err.message;
    }

    // Return models grouped by provider
    return NextResponse.json({
      providers: {
        openai: {
          name: 'OpenAI',
          models: openaiModels,
        },
        xai: {
          name: 'xAI',
          models: xaiModels,
        },
      },
      error,
    });
  } catch (error: any) {
    console.error('Error in models API:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
} 