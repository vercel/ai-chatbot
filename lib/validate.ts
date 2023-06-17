import { AnyZodObject, z } from 'zod'

export async function zValidateReq<T extends AnyZodObject>(
  schema: T,
  req: Request
): Promise<z.infer<T>> {
  const json = await req.json()
  const input = schema.safeParse(json)
  if (!input.success) {
    console.error('❌ Invalid inputs:')
    input.error.issues.forEach(issue => {
      console.error(issue)
    })
    throw new Error('Invalid environment variables')
  }
  return input.data
}
