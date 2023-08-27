import { MongoClient, Db } from "mongodb"

let cachedDb: Db | null = null

async function connectDB(): Promise<Db> {
  if (cachedDb) {
    return cachedDb
  }

  if (!process.env.MONGODB_URI || process.env.MONGODB_URI.length === 0) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
  }

  try {
    const MONGODB_URI = process.env.MONGODB_URI
    const MONGODB_DB = process.env.MONGODB_DB || ''

    const client = await MongoClient.connect(MONGODB_URI)
    cachedDb = client.db(MONGODB_DB)

    return cachedDb
  } catch (error) {
    throw error
  }
}

export default connectDB
