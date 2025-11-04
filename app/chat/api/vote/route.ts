export async function POST() {
  return new Response("Not found", { status: 404 });
}
import { auth } from "@/app/(auth)/auth";
import { getChatById, getVotesByChatId, voteMessage } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

export async function GET() {
  return new Response("Not found", { status: 404 });
}

export async function PATCH() {
  return new Response("Not found", { status: 404 });
}
