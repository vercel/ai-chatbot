import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { NexusDashboard } from "@/components/nexus/nexus-dashboard";

export const metadata = {
  title: "TiQology Nexus - Revolutionary AI Operating System",
  description:
    "Neural Memory, Vision Studio, Agent Swarms, Real-time Collaboration, and Autonomous Tasks - All in one platform",
};

export default async function NexusPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  return <NexusDashboard userId={session.user.id!} />;
}
