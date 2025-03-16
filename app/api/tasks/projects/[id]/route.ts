import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { taskProject, taskItem } from '@/lib/db/schema';

interface Params {
  params: {
    id: string;
  };
}

// GET /api/tasks/projects/[id] - Get a specific project
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = params;
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const projects = await db
      .select()
      .from(taskProject)
      .where(and(
        eq(taskProject.id, id),
        eq(taskProject.userId, session.user.id)
      ));
    
    if (projects.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    return NextResponse.json(projects[0]);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

// PATCH /api/tasks/projects/[id] - Update a project
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = params;
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const json = await request.json();
    const { name, color, isDefault } = json;
    
    // Verify the project exists and belongs to the user
    const projects = await db
      .select()
      .from(taskProject)
      .where(and(
        eq(taskProject.id, id),
        eq(taskProject.userId, session.user.id)
      ));
    
    if (projects.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    const existingProject = projects[0];
    
    // If setting as default, remove default from other projects
    if (isDefault && !existingProject.isDefault) {
      await db
        .update(taskProject)
        .set({ isDefault: false })
        .where(and(
          eq(taskProject.userId, session.user.id),
          eq(taskProject.isDefault, true)
        ));
    }
    
    // Build update object with only the provided fields
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (color !== undefined) updates.color = color;
    if (isDefault !== undefined) updates.isDefault = isDefault;
    
    // Add updated timestamp
    updates.updatedAt = new Date();
    
    const updatedProject = await db
      .update(taskProject)
      .set(updates)
      .where(and(
        eq(taskProject.id, id),
        eq(taskProject.userId, session.user.id)
      ))
      .returning();
    
    return NextResponse.json(updatedProject[0]);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

// DELETE /api/tasks/projects/[id] - Delete a project (soft delete)
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = params;
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Verify the project exists and belongs to the user
    const projects = await db
      .select()
      .from(taskProject)
      .where(and(
        eq(taskProject.id, id),
        eq(taskProject.userId, session.user.id)
      ));
    
    if (projects.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    const existingProject = projects[0];
    
    // Check if this is the default project - can't delete the default project
    if (existingProject.isDefault) {
      return NextResponse.json({ 
        error: 'Cannot delete the default project' 
      }, { status: 400 });
    }
    
    // Get another project to move tasks to
    const fallbackProjects = await db
      .select()
      .from(taskProject)
      .where(and(
        eq(taskProject.userId, session.user.id),
        eq(taskProject.isDeleted, false),
        eq(taskProject.isDefault, true)
      ));
    
    if (fallbackProjects.length === 0) {
      return NextResponse.json({ 
        error: 'Cannot delete project: no default project found to move tasks to' 
      }, { status: 400 });
    }
    
    const fallbackProject = fallbackProjects[0];
    
    // Move tasks to the fallback project
    await db
      .update(taskItem)
      .set({ projectId: fallbackProject.id })
      .where(and(
        eq(taskItem.projectId, id),
        eq(taskItem.userId, session.user.id)
      ));
    
    // Soft delete the project
    await db
      .update(taskProject)
      .set({ 
        isDeleted: true,
        updatedAt: new Date()
      })
      .where(and(
        eq(taskProject.id, id),
        eq(taskProject.userId, session.user.id)
      ));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}