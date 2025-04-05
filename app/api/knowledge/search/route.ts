import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { searchKnowledgeLocal } from '@/lib/knowledge/localFiles/localSearch';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    console.error('Unauthorized access to knowledge search API');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { query, limit = 5, documentIds } = await req.json();

    console.log(`Knowledge search API: Query="${query?.substring(0, 50)}...", User=${session.user.id}, Filtered to ${documentIds ? documentIds.length : 'all'} documents`);

    if (!query) {
      console.error('Missing query parameter in knowledge search');
      return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
    }

    // Use our local search implementation with optional document filtering
    const results = await searchKnowledgeLocal(query, session.user.id as string, limit, documentIds);
    
    console.log(`Knowledge search found ${results.length} results`);
    return NextResponse.json(results);
    
  } catch (error: any) {
    console.error('Error in knowledge search API:', error);
    console.error(error.stack || 'No stack trace available');
    
    return NextResponse.json({ 
      error: 'An error occurred in knowledge search', 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    }, { status: 500 });
  }
}