// We keep this as a test route

export async function GET() {
  const data = { hi: 'Hello World!' }
  return Response.json({ data })
}

export async function POST({ data }: { data: any }) {
  return Response.json({ data })
}
