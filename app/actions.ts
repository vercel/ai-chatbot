"use server";

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function removeChat({ id, path }: { id: string; path: string }) {
  const session = await getServerSession(authOptions);
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
