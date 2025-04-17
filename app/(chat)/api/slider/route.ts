import { auth } from "@/app/(auth)/auth";
import { ArtifactKind } from "@/components/artifact";
import { getSuggestionsByDocumentId } from "@/lib/db/queries";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Missing id", { status: 400 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { range, kind }: { range: string; kind: ArtifactKind } =
    await request.json();

  console.log(kind, "responded with range", range);

  return Response.json({ message: "success" }, { status: 200 });
}
