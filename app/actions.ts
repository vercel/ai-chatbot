"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function removeChat({ id, path }: { id: string; path: string }) {
  const session = await auth();

  const userId = session?.user?.email;
  if (!userId || !id) {
    throw new Error("Unauthorized");
  }

  await prisma.chat.delete({
    where: {
      id,
      // TODO: Add scoping
      // userId,
    },
  });

  revalidatePath("/");
  revalidatePath("/chat/[id]");
}
