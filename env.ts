const validAppEnv = ['development', 'staging', 'production'] as const

export type AppEnv = (typeof validAppEnv)[number]

export const appEnv = readAppEnv()

function readAppEnv(): AppEnv {
  const value = process.env.NEXT_PUBLIC_APP_ENV as AppEnv

  if (validAppEnv.includes(value)) return value
  return 'production'
}
