const VOYAGE_URL = "https://api.voyageai.com/v1/embeddings";

export type VoyageEmbedOptions = {
  model?: string;
  inputType?: "query" | "document" | null;
  truncation?: boolean;
  outputDimension?: number | null;
  batchSize?: number;
};

function required(name: string, value?: string) {
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

export async function embedBatchVoyage(
  texts: string[],
  opts: VoyageEmbedOptions = {}
): Promise<number[][]> {
  if (!Array.isArray(texts)) throw new Error("embedBatchVoyage: texts must be an array");
  if (texts.length === 0) return [];

  const apiKey = required("VOYAGE_API_KEY", process.env.VOYAGE_API_KEY);
  const model = opts.model ?? "voyage-finance-2";
  const inputType = opts.inputType ?? "document";
  const truncation = opts.truncation ?? true;
  const output_dimension = opts.outputDimension ?? null;
  const batchSize = Math.min(Math.max(1, opts.batchSize ?? 256), 1000);

  const out: number[][] = [];
  out.length = texts.length;

  for (let i = 0; i < texts.length; i += batchSize) {
    const chunk = texts.slice(i, i + batchSize);
    const res = await fetch(VOYAGE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        input: chunk,
        model,
        input_type: inputType,
        truncation,
        output_dimension,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Voyage embeddings error: ${res.status} ${text}`);
    }

    const data = (await res.json()) as {
      data: Array<{ embedding: number[]; index: number }>;
      model: string;
    };
    for (let j = 0; j < data.data.length; j++) {
      const item = data.data[j];
      out[i + j] = item.embedding;
    }
  }

  return out;
}
