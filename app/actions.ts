"use server";

import { auth } from "@/auth";
import { chats, db } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function removeChat({ id, path }: { id: string; path: string }) {
  const session = await auth();

  const userId = session?.user?.email;
  if (!userId || !id) {
    throw new Error("Unauthorized");
  }

  await db
    .delete(chats)
    .where(and(eq(chats.id, id), eq(chats.userId, userId)))
    .execute();

  revalidatePath("/");
  revalidatePath("/chat/[id]");
}
