import { db } from '@vercel/postgres'

async function seedUsers(client) {
  try {
    await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`
    const createTable = await client.sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        salt TEXT NOT NULL
      );
    `

    console.log(`Created "users" table`)

    return {
      createTable,
    }
  } catch (error) {
    console.error('Error seeding users:', error)
    throw error
  }
}

async function main() {
  const client = await db.connect()
  await seedUsers(client)
  await client.end()
}

main().catch(err => {
  console.error('An error occurred while attempting to seed the database:', err)
})
