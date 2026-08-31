import { getCapabilities } from "@/lib/ai/models";

export function GET() {
  const capabilities = getCapabilities();

  return Response.json(capabilities, {
    headers: {
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
