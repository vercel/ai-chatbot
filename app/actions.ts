"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session/get-server-session";
import { revalidatePath } from "next/cache";

export async function removeChat({ id, path }: { id: string; path: string }) {
  const session = await getServerSession();

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
