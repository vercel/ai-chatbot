import { NextRequest, NextResponse } from 'next/server';
import { getStorageService } from '@/lib/storage';
import { Notebook } from '@/lib/types';

interface Params {
  params: {
    id: string;
  };
}

// GET /api/notebooks/[id] - Get a notebook by ID
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const storageService = getStorageService();
    const notebook = await storageService.getNotebook(id);
    
    if (!notebook) {
      return NextResponse.json(
        { error: 'Notebook not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ notebook });
  } catch (error) {
    console.error(`Error fetching notebook ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch notebook' },
      { status: 500 }
    );
  }
}

// PUT /api/notebooks/[id] - Update a notebook
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { notebook } = await request.json() as { notebook: Notebook };
    
    if (!notebook) {
      return NextResponse.json(
        { error: 'Invalid notebook data' },
        { status: 400 }
      );
    }
    
    // Ensure the ID matches
    if (notebook.id !== id) {
      return NextResponse.json(
        { error: 'Notebook ID mismatch' },
        { status: 400 }
      );
    }
    
    const storageService = getStorageService();
    await storageService.saveNotebook(notebook);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error updating notebook ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to update notebook' },
      { status: 500 }
    );
  }
}

// DELETE /api/notebooks/[id] - Delete a notebook
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    
    const storageService = getStorageService();
    await storageService.deleteNotebook(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error deleting notebook ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete notebook' },
      { status: 500 }
    );
  }
} 