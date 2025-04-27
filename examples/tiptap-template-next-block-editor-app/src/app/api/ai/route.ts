import jsonwebtoken from 'jsonwebtoken'

const JWT_SECRET = process.env?.TIPTAP_AI_SECRET

export async function POST(): Promise<Response> {
  if (!JWT_SECRET) {
    return new Response(
      JSON.stringify({ error: 'No AI token provided, please set TIPTAP_AI_SECRET in your environment' }),
      { status: 403 },
    )
  }
  const jwt = await jsonwebtoken.sign(
    {
      /* object to be encoded in the JWT */
    },
    JWT_SECRET,
  )

  return new Response(JSON.stringify({ token: jwt }))
}
