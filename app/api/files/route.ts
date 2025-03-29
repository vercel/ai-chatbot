import { NextRequest, NextResponse } from 'next/server';
import { getStorageService } from '@/lib/storage';

// POST /api/files - Create a new file
export async function POST(request: NextRequest) {
  try {
    const { path, content } = await request.json() as { path: string; content: string };
    
    if (!path) {
      return NextResponse.json(
        { error: 'Path is required' },
        { status: 400 }
      );
    }
    
    const storageService = getStorageService();
    await storageService.saveFile(path, content || '');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating file:', error);
    return NextResponse.json(
      { error: 'Failed to create file' },
      { status: 500 }
    );
  }
}

// PUT /api/files - Update a file
export async function PUT(request: NextRequest) {
  try {
    const { path, content } = await request.json() as { path: string; content: string };
    
    if (!path) {
      return NextResponse.json(
        { error: 'Path is required' },
        { status: 400 }
      );
    }
    
    const storageService = getStorageService();
    await storageService.saveFile(path, content || '');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating file:', error);
    return NextResponse.json(
      { error: 'Failed to update file' },
      { status: 500 }
    );
  }
} 