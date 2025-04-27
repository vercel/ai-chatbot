import { type NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { db } from '@/lib/db/queries'; // CORRECTED import path
import {
  userProfiles,
  Chat,
  document, // Correct: Import the table definition value
  Message_v2,
  type Document as DocumentType, // Use alias for type
  type DBChat,
  type DBMessage,
  type UserProfile,
} from '@/lib/db/schema';
import { eq, desc, sql, inArray, exists, and } from 'drizzle-orm';
import { clerkClient } from '@clerk/nextjs/server'; // <-- Import clerkClient

// --- Type Definitions (Updated ChatStub) ---

// Basic info for sidebar list
interface ChatStub {
  id: string;
  title: string; // Chat title
  createdAt: Date;
  visibility: string; // ADD VISIBILITY
  hasDocuments: boolean;
  mostRecentDocumentTitle?: string | null; // Title of the latest doc in this chat
  mostRecentDocumentModifiedAt?: Date | null; // Added: Timestamp of the latest doc
}

// Basic document info for recent details
interface DocumentStub {
  id: string;
  title: string;
  modifiedAt: Date;
  // Add other minimal fields if needed, e.g., kind
}

// Basic message structure (adapt based on actual Message_v2 schema)
// Define a more specific type for the result of the message query
interface RecentMessageQueryResult {
  id: string;
  chatId: string;
  role: string;
  createdAt: Date;
}
interface RecentMessage extends Omit<RecentMessageQueryResult, 'chatId'> {}

// Define a more specific type for the result of the document query
interface RecentDocumentStubQueryResult {
  id: string;
  title: string;
  modifiedAt: Date | null; // Allow null
  chatId: string | null;
}
interface DocumentStub extends Omit<RecentDocumentStubQueryResult, 'chatId'> {}

// Updated Response structure
interface SidebarInitResponse {
  initialChatStubs: ChatStub[]; // Now includes optional doc title
  recentChatDetails: Record<
    string,
    { messages: RecentMessage[]; documents: DocumentStub[] }
  >; // Still includes details for recent chats
}

const INITIAL_STUBS_LIMIT = 100; // Fetch last 100 chat stubs
const RECENT_DETAILS_LIMIT = 20; // Get details for the most recent 20 of those
const RECENT_MESSAGES_LIMIT = 20; // Get last 20 messages for recent chats

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await getAuth(req);
    if (!clerkUserId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    let supabaseUserId: string | undefined;

    // --- OPTIMIZATION: Get Supabase ID from Clerk Metadata first ---
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(clerkUserId);
      if (user.publicMetadata?.internal_db_id) {
        supabaseUserId = user.publicMetadata.internal_db_id as string;
        console.log(
          `[sidebar-init] Found Supabase User ID (${supabaseUserId}) in Clerk metadata.`,
        );
      } else {
        console.log(
          '[sidebar-init] internal_db_id not found in Clerk metadata, falling back to DB lookup.',
        );
      }
    } catch (clerkError) {
      console.error(
        '[sidebar-init] Error fetching Clerk user for metadata lookup, falling back to DB lookup:',
        clerkError,
      );
    }
    // --- END OPTIMIZATION ---

    // Fallback or if metadata lookup failed
    if (!supabaseUserId) {
      const userProfile = await db
        .select({ id: userProfiles.id })
        .from(userProfiles)
        .where(eq(userProfiles.clerkId, clerkUserId))
        .limit(1);

      if (userProfile?.[0]?.id) {
        supabaseUserId = userProfile[0].id;
        console.log(
          `[sidebar-init] Found Supabase User ID (${supabaseUserId}) via DB lookup fallback.`,
        );
      } else {
        // If both metadata and DB lookup fail, return error
        console.error(
          `[sidebar-init] CRITICAL: Failed to find Supabase user ID for Clerk ID ${clerkUserId} via metadata AND DB lookup.`,
        );
        return new NextResponse('User profile not found', { status: 404 });
      }
    }

    // --- Updated Complex Query using CTE and LEFT JOIN --- //

    // Subquery for existence check (remains the same)
    const chatHasDocsSubquery = db
      .select({ _exists: sql`1` })
      .from(document)
      .where(eq(document.chatId, Chat.id))
      .limit(1);

    // Define a CTE to rank documents per chat by modifiedAt
    const rankedDocsCte = db.$with('ranked_docs').as(
      db
        .select({
          chatId: document.chatId,
          title: document.title,
          modifiedAt: document.modifiedAt,
          // Add row number to select the latest based on modifiedAt per chat
          rn: sql<number>`row_number() OVER (PARTITION BY ${document.chatId} ORDER BY ${document.modifiedAt} DESC)`.as(
            'rn',
          ),
        })
        .from(document)
        // Only consider documents actually linked to a chat
        .where(sql`${document.chatId} IS NOT NULL`),
    );

    // Now, query chats and LEFT JOIN the CTE result where row number is 1
    const initialChatStubs: ChatStub[] = await db
      .with(rankedDocsCte) // Include the CTE definition
      .select({
        id: Chat.id,
        title: Chat.title,
        createdAt: Chat.createdAt,
        visibility: Chat.visibility, // ADD VISIBILITY
        hasDocuments: sql<boolean>`${exists(chatHasDocsSubquery)}`.as(
          'has_documents',
        ),
        // Select fields from the joined CTE (aliased)
        mostRecentDocumentTitle: rankedDocsCte.title,
        mostRecentDocumentModifiedAt: rankedDocsCte.modifiedAt,
      })
      .from(Chat)
      // LEFT JOIN the CTE on chatId, only joining the latest doc (rn=1)
      .leftJoin(
        rankedDocsCte,
        and(eq(Chat.id, rankedDocsCte.chatId), eq(rankedDocsCte.rn, 1)),
      )
      .where(eq(Chat.userId, supabaseUserId))
      .orderBy(desc(Chat.createdAt))
      .limit(INITIAL_STUBS_LIMIT);

    // ---- DEBUG LOG: Log Raw DB Result ----
    console.log(
      '[DEBUG sidebar-init] Raw initialChatStubs from DB:',
      JSON.stringify(initialChatStubs, null, 2), // Stringify for full visibility
    );
    // ---- END DEBUG LOG ----

    // Extract IDs of the recent chats for detail fetching
    const recentChatIds = initialChatStubs
      .slice(0, RECENT_DETAILS_LIMIT)
      .map((chat: ChatStub) => chat.id); // Type already added

    let recentChatDetails: SidebarInitResponse['recentChatDetails'] = {};

    // 3. Fetch Details for Recent Chats (if any)
    if (recentChatIds.length > 0) {
      // Fetch recent messages for all recent chats in one query
      const recentMessages: RecentMessageQueryResult[] = await db // Add explicit type
        .select({
          id: Message_v2.id,
          chatId: Message_v2.chatId,
          role: Message_v2.role,
          createdAt: Message_v2.createdAt,
        })
        .from(Message_v2)
        .where(inArray(Message_v2.chatId, recentChatIds))
        .orderBy(desc(Message_v2.createdAt));

      // Fetch associated document stubs for all recent chats in one query
      const recentDocumentStubs: RecentDocumentStubQueryResult[] = await db // Add explicit type
        .select({
          id: document.id, // Use correct value import
          title: document.title, // Use correct value import
          modifiedAt: document.modifiedAt, // Use correct value import
          chatId: document.chatId, // Use correct value import
        })
        .from(document) // Use correct value import
        .where(inArray(document.chatId, recentChatIds)); // Use correct value import

      // Process messages and documents into the recentChatDetails map
      // Add explicit types to reduce parameters
      recentChatDetails = recentChatIds.reduce(
        (acc: SidebarInitResponse['recentChatDetails'], chatId: string) => {
          const chatMessages: RecentMessage[] = recentMessages
            .filter((m: RecentMessageQueryResult) => m.chatId === chatId)
            .slice(0, RECENT_MESSAGES_LIMIT)
            // Map to RecentMessage type (omitting chatId)
            .map(
              (m: RecentMessageQueryResult): RecentMessage => ({
                id: m.id,
                role: m.role,
                createdAt: new Date(m.createdAt),
              }),
            );

          const chatDocs: DocumentStub[] = recentDocumentStubs
            .filter((d: RecentDocumentStubQueryResult) => d.chatId === chatId)
            // Map to DocumentStub type (omitting chatId)
            .map(
              (d: RecentDocumentStubQueryResult): DocumentStub => ({
                id: d.id,
                title: d.title,
                modifiedAt: d.modifiedAt ? new Date(d.modifiedAt) : new Date(0),
              }),
            );

          acc[chatId] = { messages: chatMessages, documents: chatDocs };
          return acc;
        },
        {} as SidebarInitResponse['recentChatDetails'],
      );
    }
    // --- End Complex Query --- //

    // 4. Prepare Response
    const responseData: SidebarInitResponse = {
      initialChatStubs: initialChatStubs.map((stub): ChatStub => {
        const result: ChatStub = {
          id: stub.id,
          title: stub.title,
          createdAt: new Date(stub.createdAt),
          visibility: stub.visibility,
          hasDocuments: stub.hasDocuments,
          mostRecentDocumentTitle: stub.mostRecentDocumentTitle ?? null,
          mostRecentDocumentModifiedAt: stub.mostRecentDocumentModifiedAt
            ? new Date(stub.mostRecentDocumentModifiedAt)
            : null,
        };
        return result;
      }),
      recentChatDetails, // Use the fetched details again
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('[/api/sidebar-init GET] Error:', error);
    return new NextResponse(`Internal Server Error: ${error.message}`, {
      status: 500,
    });
  }
}
