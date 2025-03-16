import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { taskItem } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

// GET /api/tasks
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use drizzle ORM to fetch tasks
    const tasks = await db.query.taskItem.findMany({
      where: and(
        eq(taskItem.userId, session.user.id),
        eq(taskItem.isDeleted, false)
      ),
      orderBy: [
        { createdAt: "desc" }
      ],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Error fetching tasks" },
      { status: 500 }
    );
  }
}

// POST /api/tasks
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    // Create a task using drizzle ORM
    const [task] = await db
      .insert(taskItem)
      .values({
        userId: session.user.id,
        projectId: data.projectId, // You'll need to handle default project logic
        content: data.content,
        description: data.description || null,
        completed: data.completed || false,
        priority: data.priority || "p4",
        dueDate: data.dueDate || null,
        isDeleted: false,
      })
      .returning();

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Error creating task" },
      { status: 500 }
    );
  }
}
