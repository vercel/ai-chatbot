'use server'

export async function getMissingKeys() {
  const keysRequired = ['TUNE_STUDIO_API_KEY']
  return keysRequired
    .map(key => (process.env[key] ? '' : key))
    .filter(key => key !== '')
}
