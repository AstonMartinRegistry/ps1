export async function getDeepinfraEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.DEEPINFRA_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPINFRA_API_KEY is not set");
  }

  const res = await fetch(
    "https://api.deepinfra.com/v1/inference/Qwen/Qwen3-Embedding-4B",
    {
      method: "POST",
      headers: {
        Authorization: `bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: [text] }),
      // 30s like the python example
      next: { revalidate: 0 },
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`DeepInfra error ${res.status}: ${body}`);
  }
  const json = await res.json();
  const embedding: number[] | undefined = json?.embeddings?.[0];
  if (!embedding || !Array.isArray(embedding)) {
    throw new Error("Invalid embedding response from DeepInfra");
  }
  return embedding;
}


