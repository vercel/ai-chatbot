/**
 * helpers
 */

interface ErrorResponse {
  code: number
  displayMsg: string
  message: string
  params?: string[]
}

export function isErrorResponse(data: any): data is ErrorResponse {
  return typeof data.message === 'string'
}

export class ApiError extends Error {
  constructor(
    public readonly code: number,
    public readonly displayMessage: string,
    message: string,
    public readonly params?: string[]
  ) {
    super(message)
  }
}

export interface RequestParams {
  method: string
  url: string
  queries?: any
  body?: any
  accessToken?: any
  header?: any
  next?: any
  isEmptyHeader?: boolean
  cb?: () => void
}

export async function makeRequest<Result>({
  method,
  url,
  queries,
  body,
  accessToken = process.env.SONA_API_KEY, // hardcode access token given by backend for now
  header = {},
  next,
  isEmptyHeader = false,
  cb
}: RequestParams) {
  const headers = new Headers(
    // clear default content-type and let browser auto infer proper content-type
    isEmptyHeader
      ? {}
      : {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...header
        }
  )
  if (accessToken) headers.set('X-API-KEY', `Bearer ${accessToken}`)

  const apiUrl = `${url}${makeQuery(queries)}`
  console.log('🚀 ~ apiUrl:', apiUrl)

  const resp = await fetch(apiUrl, {
    method,
    body: body && (isEmptyHeader ? body : JSON.stringify(body)),
    headers,
    next
  })

  if (!resp.ok) {
    const errorResponse = await resp.json()
    console.log('🚀 ~ errorResponse:', errorResponse)
    throw new ApiError(resp.status, resp.statusText, JSON.stringify(errorResponse))
  }

  const data: Result = await resp.json()
  console.log('🚀 ~ data:', data)

  cb?.()

  return data
}

export function makeQueryArray<T>(name: string, value: T[]) {
  return value.length > 0 ? value.map(v => `${name}=${v}`).join('&') : ''
}

export function concatQueries(...queries: (string | undefined)[]) {
  return queries.filter(Boolean).join('&')
}

export function makeQuery(obj: any) {
  if (!obj) return ''
  return `?${concatQueries(
    ...Object.keys(obj).reduce(
      (queries, key) => {
        const value = obj[key]
        let query: string | undefined
        if (Array.isArray(value)) query = makeQueryArray(key, value)
        else if (typeof value !== 'undefined') query = `${key}=${value}`
        return [...queries, query]
      },
      [] as (string | undefined)[]
    )
  )}`
}
