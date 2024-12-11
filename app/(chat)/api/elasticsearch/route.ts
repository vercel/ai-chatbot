export async function POST(req: Request) {
  const { query }: { query: string } = await req.json();

  try {
    const response = await fetch('http://localhost:9200/filebeat-*/_search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + btoa('elastic:changeme'), // Replace with your actual username and password
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`Elasticsearch error: ${response.statusText}`);
    }

    const data = await response.json();

    // Create a response with headers to disable caching
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
