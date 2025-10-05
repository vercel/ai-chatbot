import { withAuthApi } from "@/lib/auth/route-guards";

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;

export const POST = withAuthApi(async () => {
  try {
    if (!ASSEMBLYAI_API_KEY) {
      return Response.json(
        { error: "AssemblyAI API key not configured" },
        { status: 500 }
      );
    }

    const params = new URLSearchParams({ expires_in_seconds: "600" });

    const response = await fetch(
      `https://streaming.assemblyai.com/v3/token?${params.toString()}`,
      {
        method: "GET",
        headers: { Authorization: ASSEMBLYAI_API_KEY },
        // No caching of short-lived credentials
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      return Response.json(
        { error: "Failed to generate token", details: errorData },
        { status: response.status }
      );
    }

    const data = (await response.json()) as { token?: string };
    if (!data?.token) {
      return Response.json(
        { error: "Invalid response from AssemblyAI" },
        { status: 502 }
      );
    }

    return Response.json({ token: data.token }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json(
      { error: "Error generating realtime token", details: message },
      { status: 500 }
    );
  }
});

export async function GET() {
  return Response.json({ error: "Method Not Allowed" }, { status: 405 });
}

