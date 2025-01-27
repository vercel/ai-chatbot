import { DataStreamWriter, tool } from 'ai';
import { z } from 'zod';
import { eq, sql, desc, and, gt, cosineDistance } from 'drizzle-orm';
import { db } from '@/lib/db/queries';
import { dataFlightKnowledge } from '@/lib/db/schema';
import { Model } from '../models';
import { Session } from 'next-auth';
import { generateEmbedding } from '../embedding';


interface LookupFlightManualProps {
    dataStream: DataStreamWriter;
}

export const lookupFlightManual = ({ dataStream }: LookupFlightManualProps) =>
  tool({
    description:
      'Search the flight manual database for relevant information about specific aircraft types and questions. Returns the most relevant documentation sections based on vector similarity search.',
    parameters: z.object({
      aircraft_type: z.string().describe('The type/model of aircraft being queried about'),
      question: z.string().describe('The specific question or topic to search for'),
    }),
    execute: async ({ aircraft_type, question }) => {
      console.log('lookupFlightManual tool called');
      try {
        // First, notify the stream that we're starting the search
        dataStream.writeData({
          type: 'status',
          content: 'Searching flight manual database...',
        });

        // Simplified query using cosine similarity
        const userQueryEmbedded = await generateEmbedding(question);
        const similarityScore = sql<number>`1-(${cosineDistance(dataFlightKnowledge.embedding, userQueryEmbedded)})`;

        
        const results = await db
          .select({
            content: dataFlightKnowledge.text,
            aircraft_type: dataFlightKnowledge.aircraft_type,
            similarity: similarityScore,
          })
          .from(dataFlightKnowledge)
          .where(
            and(
              eq(dataFlightKnowledge.aircraft_type, aircraft_type),
              gt(similarityScore, 0.7)
            )
          )
          .orderBy(desc(similarityScore))
          .limit(3);

        if (!results.length) {
          dataStream.writeData({
            type: 'warning',
            content: 'No relevant information found in the flight manual.',
          });

          return {
            found: false,
            message: 'No relevant documentation found for the specified aircraft type and question.',
          };
        }

        // Stream each relevant section
        for (const row of results) {
          dataStream.writeData({
            type: 'section',
            content: {
              content: row.content,
              similarity: row.similarity,
            },
          });
        }

        dataStream.writeData({
          type: 'finish',
          content: '',
        });

        return {
          found: true,
          message: `Found ${results.length} relevant sections in the flight manual.`,
          sections: results.map((row) => ({
            content: row.content,
            similarity: row.similarity,
          })),
        };

      } catch (error) {
        console.error('Error searching flight manual:', error);
        dataStream.writeData({
          type: 'error',
          content: 'An error occurred while searching the flight manual.',
        });

        throw new Error('Failed to search flight manual database');
      }
    },
  });
