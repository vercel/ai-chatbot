import { auth } from "@/app/(auth)/auth";
import { searchChatsByUserId } from "@/lib/db/queries";
import { groupChatsByDate } from "@/lib/utils";

function transformSearchResults(searchResults: any[], query: string) {
  return searchResults.map((result) => {
    let preview = result.preview;
    let contextPreview = "";

    try {
      // NOTE: user messages stored in our DB are plain string & tool call results are stored as JSON.
      // TODO: As tool call results have different schemas in the DB, we only show no preview available for now
      if (result.role !== "user") {
        preview = "No preview available";

        // LLM responses are stored under the "text" key
        if (result.role === "assistant") {
          const previewData = JSON.parse(result.preview);

          if (previewData[0].text) {
            preview = previewData[0].text;
          }
        }
      }

      // Generate a context preview with 50 characters before and after the query match
      if (preview !== "No preview available") {
        const sanitizedQuery = query.toLowerCase();
        const lowerPreview = preview.toLowerCase();
        const matchIndex = lowerPreview.indexOf(sanitizedQuery);

        // Calculate start and end indices for the context window
        if (matchIndex !== -1) {
          const startIndex = Math.max(0, matchIndex - 50);
          const endIndex = Math.min(
            preview.length,
            matchIndex + sanitizedQuery.length + 50
          );

          contextPreview = preview.substring(startIndex, endIndex);

          // Add ellipsis if we're not showing from the beginning or to the end
          if (startIndex > 0) {
            contextPreview = "..." + contextPreview;
          }
          if (endIndex < preview.length) {
            contextPreview += "...";
          }
          preview = contextPreview;
        } else {
          // If for some reason the query isn't found in the preview, fallback to showing the first part
          preview =
            preview?.length > 100 ? preview?.slice(0, 100) + "..." : preview;
        }
      }
    } catch (e: any) {
      preview = "No preview available";
    }

    return {
      id: result.id,
      title: result.title || "Untitled",
      // TODO: Strip any markdown formatting from the preview
      preview,
      createdAt: new Date(result.createdAt),
      role: result.role,
      userId: result.userId,
      visibility: result.visibility,
    };
  });
}

export async function GET(request: Request) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return Response.json("Unauthorized!", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim?.();

  if (!query) {
    return Response.json(
      { error: "Search query is required" },
      { status: 400 }
    );
  }

  const searchResults = await searchChatsByUserId({
    userId: session.user.id,
    query,
  });

  const transformedResults = transformSearchResults(searchResults, query);
  const groupedResults = groupChatsByDate(transformedResults);

  return Response.json(groupedResults);
}
