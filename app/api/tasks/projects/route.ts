import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { taskProject } from '@/lib/db/schema';

// GET /api/tasks/projects - Get all projects for the current user
export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const projects = await db
      .select()
      .from(taskProject)
      .where(and(
        eq(taskProject.userId, session.user.id),
        eq(taskProject.isDeleted, false)
      ));
    
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

// POST /api/tasks/projects - Create a new project
export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const json = await request.json();
    const { name, color, isDefault } = json;
    
    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }
    
    // Check if a default project already exists if this is set as default
    if (isDefault) {
      const existingDefaults = await db
        .select()
        .from(taskProject)
        .where(and(
          eq(taskProject.userId, session.user.id),
          eq(taskProject.isDefault, true),
          eq(taskProject.isDeleted, false)
        ));
      
      if (existingDefaults.length > 0) {
        // Remove default status from existing default project
        await db
          .update(taskProject)
          .set({ isDefault: false })
          .where(eq(taskProject.id, existingDefaults[0].id));
      }
    }
    
    const newProject = await db.insert(taskProject).values({
      userId: session.user.id,
      name,
      color: color || '#808080',
      isDefault: isDefault || false,
      isDeleted: false,
    }).returning();
    
    return NextResponse.json(newProject[0]);
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}