import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { taskItem } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

// GET /api/tasks/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const task = await db.query.taskItem.findFirst({
      where: and(
        eq(taskItem.id, params.id),
        eq(taskItem.userId, session.user.id),
        eq(taskItem.isDeleted, false)
      ),
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: "Error fetching task" },
      { status: 500 }
    );
  }
}

// PATCH /api/tasks/[id]
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    // First check if the task exists and belongs to the user
    const existingTask = await db.query.taskItem.findFirst({
      where: and(
        eq(taskItem.id, params.id),
        eq(taskItem.userId, session.user.id),
        eq(taskItem.isDeleted, false)
      ),
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Update the task
    const [updatedTask] = await db
      .update(taskItem)
      .set({
        content: data.content !== undefined ? data.content : existingTask.content,
        description: data.description !== undefined ? data.description : existingTask.description,
        completed: data.completed !== undefined ? data.completed : existingTask.completed,
        priority: data.priority !== undefined ? data.priority : existingTask.priority,
        dueDate: data.dueDate !== undefined ? data.dueDate : existingTask.dueDate,
        updatedAt: new Date(),
      })
      .where(eq(taskItem.id, params.id))
      .returning();

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Error updating task" },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First check if the task exists and belongs to the user
    const existingTask = await db.query.taskItem.findFirst({
      where: and(
        eq(taskItem.id, params.id),
        eq(taskItem.userId, session.user.id),
        eq(taskItem.isDeleted, false)
      ),
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Soft delete the task by setting isDeleted to true
    await db
      .update(taskItem)
      .set({
        isDeleted: true,
        updatedAt: new Date(),
      })
      .where(eq(taskItem.id, params.id));

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Error deleting task" },
      { status: 500 }
    );
  }
}
