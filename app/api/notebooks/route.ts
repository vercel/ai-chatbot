import { NextRequest, NextResponse } from 'next/server';
import { getStorageService } from '@/lib/storage';
import { Notebook } from '@/lib/types';

// GET /api/notebooks - List all notebooks
export async function GET() {
  try {
    const storageService = getStorageService();
    const notebooks = await storageService.getNotebooks();
    
    return NextResponse.json({ notebooks });
  } catch (error) {
    console.error('Error fetching notebooks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notebooks' },
      { status: 500 }
    );
  }
}

// POST /api/notebooks - Create a new notebook
export async function POST(request: NextRequest) {
  try {
    const { notebook } = await request.json() as { notebook: Notebook };
    
    if (!notebook || !notebook.id) {
      return NextResponse.json(
        { error: 'Invalid notebook data' },
        { status: 400 }
      );
    }
    
    const storageService = getStorageService();
    await storageService.saveNotebook(notebook);
    
    return NextResponse.json({ id: notebook.id, success: true });
  } catch (error) {
    console.error('Error creating notebook:', error);
    return NextResponse.json(
      { error: 'Failed to create notebook' },
      { status: 500 }
    );
  }
} 