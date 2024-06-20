import { appEnv, AppEnv } from 'env'

const apiEndpointMap: Record<AppEnv, string> = {
  development: 'https://sona-dev.api.dwave.cc/v1',
  staging: 'https://sona-stg.api.dwave.cc/v1',
  production: 'https://sona.api.dwave.cc/v1'
}

export const endpoint = apiEndpointMap[appEnv]
