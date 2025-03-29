import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { getStorageService } from '@/lib/storage';
import { generateUUID } from '@/lib/utils';

// POST /api/execute - Execute Python code
export async function POST(request: NextRequest) {
  try {
    const { code, filePath } = await request.json() as { code: string; filePath: string };
    
    if (!code) {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      );
    }
    
    // Create a temporary file to execute
    const tempDir = path.join(os.tmpdir(), 'notebook-python');
    await fs.mkdir(tempDir, { recursive: true });
    
    const tempFile = path.join(tempDir, `${generateUUID()}.py`);
    await fs.writeFile(tempFile, code);
    
    // Execute the Python code
    const result = await executePython(tempFile);
    
    // Clean up
    try {
      await fs.unlink(tempFile);
    } catch (err) {
      console.error('Failed to clean up temp file:', err);
    }
    
    return NextResponse.json({ output: result });
  } catch (error) {
    console.error('Error executing Python code:', error);
    return NextResponse.json(
      { error: 'Failed to execute Python code' },
      { status: 500 }
    );
  }
}

// Execute Python code in a subprocess
function executePython(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(`python ${filePath}`, { timeout: 10000 }, (error, stdout, stderr) => {
      if (error) {
        // If the execution failed, return the error message
        return resolve(stderr || error.message);
      }
      
      resolve(stdout);
    });
  });
} 