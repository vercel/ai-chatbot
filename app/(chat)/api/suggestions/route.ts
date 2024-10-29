import { getSuggestionsByDocumentId } from "@/db/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get("documentId");

  if (!documentId) {
    return new Response("Not Found", { status: 404 });
  }

  const suggestions = await getSuggestionsByDocumentId({
    documentId,
  });

  return Response.json(suggestions, { status: 200 });
}
