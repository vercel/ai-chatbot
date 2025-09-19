# Supabase Setup for AI Chatbot

This document explains how to set up Supabase for the AI Chatbot application.

## Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. A Supabase project created

## Setup Steps

### 1. Create Supabase Project

If you haven't already, create a new Supabase project from the Supabase dashboard.

### 2. Set Up Database Schema

You can set up the database schema in one of two ways:

#### Option 1: Using the SQL Editor

1. Navigate to the SQL Editor in your Supabase dashboard
2. Copy the contents of `lib/supabase/schema.sql`
3. Paste and execute the SQL in the editor

#### Option 2: Using the Supabase CLI

1. Install the Supabase CLI
2. Run `supabase db push` with the schema file

### 3. Configure Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

You can find these values in your Supabase project settings under "API".

### 4. Testing the Connection

Run the test script to verify your connection:

```bash
npx tsx lib/supabase/test-connection.ts
```

## Database Schema

The application uses the following tables:

- `User`: Stores user information
- `Chat`: Stores chat sessions
- `Message_v2`: Stores chat messages
- `Vote_v2`: Stores message votes
- `Document`: Stores documents created by the AI
- `Suggestion`: Stores suggestions for documents
- `Stream`: Stores stream information for chat sessions

## Authentication

The application uses Supabase Auth with Next.js Auth.js for authentication. Users can:

1. Register with email/password
2. Sign in with email/password
3. Use a guest account

## API Functions

The application provides the following API functions through Supabase:

- User management (create, get)
- Chat management (create, get, delete)
- Message management (save, get, delete)
- Document management (create, get, update, delete)
- Voting system (vote on messages)
- Suggestions for documents

## Troubleshooting

If you encounter issues:

1. Verify your Supabase URL and anon key are correct
2. Check that your database schema is set up correctly
3. Ensure you have the proper permissions set in Supabase
4. Check the Supabase logs for any errors
