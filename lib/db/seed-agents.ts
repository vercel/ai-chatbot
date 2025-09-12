import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { agent } from './schema';

config({ path: '.env.local' });

const starters = [
  {
    slug: 'research-analyst',
    name: 'Research Analyst',
    description:
      'Investigates across transcripts, email, and Slack; synthesizes sources with citations and next steps.',
    basePrompt:
      'Act as a research analyst. Prioritize grounded answers with clear citations to transcripts, emails, and Slack messages. Summarize findings, highlight risks, and propose next steps.',
    modelId: 'chat-model',
  },
  {
    slug: 'meeting-summarizer',
    name: 'Meeting Summarizer',
    description:
      'Summarizes meetings from transcripts with decisions, owners, and deadlines.',
    basePrompt:
      'You summarize meetings crisply. Output sections: Context, Decisions, Action Items (owner, due date), Open Questions. Keep to bullet points and cite transcript timestamps when available.',
    modelId: 'chat-model',
  },
  {
    slug: 'email-drafter',
    name: 'Email Drafter',
    description:
      'Drafts clear, concise emails; adapts tone and suggests subject lines.',
    basePrompt:
      'Draft concise emails with a helpful subject line and 2–3 tone options. Prefer short paragraphs, active voice, and clear calls to action. Offer variants when appropriate.',
    modelId: 'chat-model',
  },
];

async function main() {
  const url = process.env.POSTGRES_URL;
  if (!url) throw new Error('POSTGRES_URL is not defined');

  const connection = postgres(url, { max: 1 });
  const db = drizzle(connection);

  for (const a of starters) {
    await db
      .insert(agent)
      .values({
        slug: a.slug,
        name: a.name,
        description: a.description,
        basePrompt: a.basePrompt,
        modelId: a.modelId,
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoNothing();
  }

  await connection.end({ timeout: 0 });
  // eslint-disable-next-line no-console
  console.log('Seeded starter agents (if not present).');
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

