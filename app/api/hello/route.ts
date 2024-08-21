export async function GET() {
  const data = { hi: 'Hello World!' }

  return Response.json({ data })
}
