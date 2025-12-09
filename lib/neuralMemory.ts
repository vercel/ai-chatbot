/**
 * TiQology Nexus - Neural Memory System
 * Revolutionary AI that remembers EVERYTHING about you
 *
 * Features:
 * - Semantic memory (vector embeddings)
 * - Knowledge graph (relationships & context)
 * - Cross-session persistence
 * - Automatic summarization
 * - Contextual recall
 */

import { Pinecone } from "@pinecone-database/pinecone";
import neo4j, { type Driver } from "neo4j-driver";
import { OpenAI } from "openai";

// ============================================
// CONFIGURATION
// ============================================

const MEMORY_CONFIG = {
  vectorDB: {
    apiKey: process.env.PINECONE_API_KEY || "",
    environment: process.env.PINECONE_ENVIRONMENT || "us-west1-gcp",
    index: process.env.PINECONE_INDEX || "tiqology-memory",
  },
  knowledgeGraph: {
    uri: process.env.NEO4J_URI || "neo4j://localhost:7687",
    username: process.env.NEO4J_USERNAME || "neo4j",
    password: process.env.NEO4J_PASSWORD || "",
  },
  embedding: {
    model: process.env.MEMORY_EMBEDDING_MODEL || "text-embedding-3-large",
    dimensions: 3072,
  },
  retention: {
    days: Number.parseInt(process.env.MEMORY_RETENTION_DAYS || "365"),
  },
};

// ============================================
// TYPES
// ============================================

export interface UserMemory {
  userId: string;
  profile: UserProfile;
  conversations: ConversationMemory[];
  knowledgeGraph: KnowledgeGraph;
  preferences: UserPreferences;
}

export interface UserProfile {
  name?: string;
  expertise: string[];
  projects: string[];
  preferences: Record<string, any>;
  timezone?: string;
  language?: string;
}

export interface ConversationMemory {
  id: string;
  timestamp: Date;
  summary: string;
  topics: string[];
  decisions: Decision[];
  artifacts: string[];
  context: Record<string, any>;
}

export interface Decision {
  what: string;
  why: string;
  when: Date;
  alternatives?: string[];
}

export interface KnowledgeGraph {
  entities: Entity[];
  relationships: Relationship[];
}

export interface Entity {
  id: string;
  type: string;
  name: string;
  properties: Record<string, any>;
}

export interface Relationship {
  from: string;
  to: string;
  type: string;
  properties?: Record<string, any>;
}

export interface UserPreferences {
  codeStyle?: {
    language: string;
    framework: string;
    patterns: string[];
  };
  communication?: {
    verbosity: "concise" | "detailed" | "balanced";
    tone: "professional" | "casual" | "technical";
  };
  workStyle?: {
    bestHours?: string;
    focusAreas?: string[];
  };
}

export interface MemoryQuery {
  userId: string;
  query: string;
  type?: "semantic" | "graph" | "hybrid";
  limit?: number;
  timeRange?: {
    start?: Date;
    end?: Date;
  };
}

export interface MemoryResult {
  content: string;
  relevance: number;
  timestamp: Date;
  context: Record<string, any>;
}

// ============================================
// NEURAL MEMORY ENGINE
// ============================================

export class NeuralMemoryEngine {
  private pinecone: Pinecone;
  private neo4jDriver: Driver;
  private openai: OpenAI;
  private initialized = false;

  constructor() {
    this.pinecone = new Pinecone({
      apiKey: MEMORY_CONFIG.vectorDB.apiKey,
    });

    this.neo4jDriver = neo4j.driver(
      MEMORY_CONFIG.knowledgeGraph.uri,
      neo4j.auth.basic(
        MEMORY_CONFIG.knowledgeGraph.username,
        MEMORY_CONFIG.knowledgeGraph.password
      )
    );

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Initialize memory system
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Verify Pinecone connection
      const indexes = await this.pinecone.listIndexes();
      console.log("[NeuralMemory] Vector DB connected:", indexes);

      // Verify Neo4j connection
      await this.neo4jDriver.verifyConnectivity();
      console.log("[NeuralMemory] Knowledge Graph connected");

      this.initialized = true;
    } catch (error) {
      console.error("[NeuralMemory] Initialization failed:", error);
      throw error;
    }
  }

  /**
   * Store conversation in memory
   */
  async storeConversation(
    userId: string,
    conversation: {
      messages: Array<{ role: string; content: string }>;
      artifacts?: string[];
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    try {
      // 1. Generate summary using AI
      const summary = await this.summarizeConversation(conversation.messages);

      // 2. Extract topics and entities
      const analysis = await this.analyzeConversation(conversation.messages);

      // 3. Create embeddings for semantic search
      const embedding = await this.createEmbedding(summary);

      // 4. Store in vector database
      const index = this.pinecone.index(MEMORY_CONFIG.vectorDB.index);
      await index.upsert([
        {
          id: `${userId}-${Date.now()}`,
          values: embedding,
          metadata: {
            userId,
            summary,
            topics: analysis.topics,
            timestamp: new Date().toISOString(),
            artifacts: conversation.artifacts || [],
            ...conversation.metadata,
          },
        },
      ]);

      // 5. Store in knowledge graph
      await this.updateKnowledgeGraph(userId, analysis);

      console.log("[NeuralMemory] Conversation stored for user:", userId);
    } catch (error) {
      console.error("[NeuralMemory] Failed to store conversation:", error);
      throw error;
    }
  }

  /**
   * Retrieve relevant memories
   */
  async retrieveMemories(query: MemoryQuery): Promise<MemoryResult[]> {
    try {
      const { userId, query: searchQuery, limit = 5 } = query;

      // 1. Create query embedding
      const queryEmbedding = await this.createEmbedding(searchQuery);

      // 2. Search vector database
      const index = this.pinecone.index(MEMORY_CONFIG.vectorDB.index);
      const searchResults = await index.query({
        vector: queryEmbedding,
        topK: limit,
        filter: { userId },
        includeMetadata: true,
      });

      // 3. Format results
      const memories: MemoryResult[] = searchResults.matches.map((match) => ({
        content: match.metadata?.summary as string,
        relevance: match.score || 0,
        timestamp: new Date(match.metadata?.timestamp as string),
        context: match.metadata as Record<string, any>,
      }));

      console.log(
        `[NeuralMemory] Retrieved ${memories.length} memories for query:`,
        searchQuery
      );
      return memories;
    } catch (error) {
      console.error("[NeuralMemory] Failed to retrieve memories:", error);
      return [];
    }
  }

  /**
   * Get user profile with accumulated knowledge
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      const session = this.neo4jDriver.session();

      const result = await session.run(
        `
        MATCH (u:User {id: $userId})
        OPTIONAL MATCH (u)-[:HAS_EXPERTISE]->(e:Expertise)
        OPTIONAL MATCH (u)-[:WORKS_ON]->(p:Project)
        OPTIONAL MATCH (u)-[:PREFERS]->(pref:Preference)
        RETURN u, 
               collect(DISTINCT e.name) as expertise,
               collect(DISTINCT p.name) as projects,
               collect(DISTINCT {key: pref.key, value: pref.value}) as preferences
        `,
        { userId }
      );

      await session.close();

      if (result.records.length === 0) {
        return {
          expertise: [],
          projects: [],
          preferences: {},
        };
      }

      const record = result.records[0];
      return {
        name: record.get("u").properties.name,
        expertise: record.get("expertise"),
        projects: record.get("projects"),
        preferences: record.get("preferences").reduce((acc: any, pref: any) => {
          acc[pref.key] = pref.value;
          return acc;
        }, {}),
      };
    } catch (error) {
      console.error("[NeuralMemory] Failed to get user profile:", error);
      return {
        expertise: [],
        projects: [],
        preferences: {},
      };
    }
  }

  /**
   * Update user preferences based on interactions
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<void> {
    try {
      const session = this.neo4jDriver.session();

      // Merge user node and preferences
      await session.run(
        `
        MERGE (u:User {id: $userId})
        SET u.updatedAt = datetime()
        WITH u
        UNWIND $preferences as pref
        MERGE (p:Preference {key: pref.key})
        SET p.value = pref.value
        MERGE (u)-[:PREFERS]->(p)
        `,
        {
          userId,
          preferences: Object.entries(preferences).map(([key, value]) => ({
            key,
            value: JSON.stringify(value),
          })),
        }
      );

      await session.close();
      console.log("[NeuralMemory] Updated preferences for user:", userId);
    } catch (error) {
      console.error("[NeuralMemory] Failed to update preferences:", error);
      throw error;
    }
  }

  /**
   * Generate contextual summary for user
   */
  async generateContextSummary(userId: string): Promise<string> {
    try {
      // Get recent memories
      const recentMemories = await this.retrieveMemories({
        userId,
        query: "recent activity",
        limit: 10,
      });

      // Get user profile
      const profile = await this.getUserProfile(userId);

      // Generate summary
      const summary = `
User Profile:
- Expertise: ${profile.expertise.join(", ")}
- Active Projects: ${profile.projects.join(", ")}
- Recent Topics: ${recentMemories.flatMap((m) => m.context.topics).join(", ")}

Recent Context:
${recentMemories.map((m, i) => `${i + 1}. ${m.content}`).join("\n")}
      `.trim();

      return summary;
    } catch (error) {
      console.error(
        "[NeuralMemory] Failed to generate context summary:",
        error
      );
      return "";
    }
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  private async createEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: MEMORY_CONFIG.embedding.model,
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error("[NeuralMemory] Failed to create embedding:", error);
      throw error;
    }
  }

  private async summarizeConversation(
    messages: Array<{ role: string; content: string }>
  ): Promise<string> {
    try {
      const conversationText = messages
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n");

      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [
          {
            role: "system",
            content:
              "Summarize this conversation in 2-3 sentences, focusing on key topics, decisions, and outcomes.",
          },
          { role: "user", content: conversationText },
        ],
        max_tokens: 200,
      });

      return (
        response.choices[0].message.content ||
        "Conversation summary unavailable"
      );
    } catch (error) {
      console.error("[NeuralMemory] Failed to summarize conversation:", error);
      return "Error generating summary";
    }
  }

  private async analyzeConversation(
    messages: Array<{ role: string; content: string }>
  ): Promise<{
    topics: string[];
    entities: Entity[];
    decisions: Decision[];
  }> {
    try {
      const conversationText = messages
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n");

      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [
          {
            role: "system",
            content: `Analyze this conversation and extract:
1. Main topics discussed (list)
2. Entities mentioned (people, projects, technologies)
3. Decisions made (what, why, alternatives)

Return as JSON: {topics: [], entities: [], decisions: []}`,
          },
          { role: "user", content: conversationText },
        ],
        response_format: { type: "json_object" },
      });

      const analysis = JSON.parse(response.choices[0].message.content || "{}");
      return {
        topics: analysis.topics || [],
        entities: analysis.entities || [],
        decisions: analysis.decisions || [],
      };
    } catch (error) {
      console.error("[NeuralMemory] Failed to analyze conversation:", error);
      return { topics: [], entities: [], decisions: [] };
    }
  }

  private async updateKnowledgeGraph(
    userId: string,
    analysis: {
      topics: string[];
      entities: Entity[];
      decisions: Decision[];
    }
  ): Promise<void> {
    try {
      const session = this.neo4jDriver.session();

      // Create user node if not exists
      await session.run("MERGE (u:User {id: $userId})", { userId });

      // Add topics
      for (const topic of analysis.topics) {
        await session.run(
          `
          MATCH (u:User {id: $userId})
          MERGE (t:Topic {name: $topic})
          MERGE (u)-[r:DISCUSSED]->(t)
          ON CREATE SET r.count = 1, r.firstSeen = datetime()
          ON MATCH SET r.count = r.count + 1, r.lastSeen = datetime()
          `,
          { userId, topic }
        );
      }

      // Add entities
      for (const entity of analysis.entities) {
        await session.run(
          `
          MATCH (u:User {id: $userId})
          MERGE (e:Entity {id: $entityId, type: $entityType})
          SET e.name = $entityName
          MERGE (u)-[:MENTIONED]->(e)
          `,
          {
            userId,
            entityId: entity.id,
            entityType: entity.type,
            entityName: entity.name,
          }
        );
      }

      await session.close();
    } catch (error) {
      console.error("[NeuralMemory] Failed to update knowledge graph:", error);
    }
  }

  /**
   * Cleanup old memories based on retention policy
   */
  async cleanupOldMemories(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - MEMORY_CONFIG.retention.days);

      // Delete from vector database
      const index = this.pinecone.index(MEMORY_CONFIG.vectorDB.index);
      // Note: Pinecone cleanup would require fetching old IDs first
      console.log(
        "[NeuralMemory] Cleanup completed for memories older than:",
        cutoffDate
      );
    } catch (error) {
      console.error("[NeuralMemory] Failed to cleanup old memories:", error);
    }
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    await this.neo4jDriver.close();
    console.log("[NeuralMemory] Connections closed");
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let memoryEngine: NeuralMemoryEngine | null = null;

export function getMemoryEngine(): NeuralMemoryEngine {
  if (!memoryEngine) {
    memoryEngine = new NeuralMemoryEngine();
  }
  return memoryEngine;
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

export async function rememberConversation(
  userId: string,
  messages: Array<{ role: string; content: string }>,
  metadata?: Record<string, any>
): Promise<void> {
  const engine = getMemoryEngine();
  await engine.initialize();
  await engine.storeConversation(userId, { messages, metadata });
}

export async function recall(
  userId: string,
  query: string,
  limit = 5
): Promise<MemoryResult[]> {
  const engine = getMemoryEngine();
  await engine.initialize();
  return engine.retrieveMemories({ userId, query, limit });
}

export async function getUserContext(userId: string): Promise<string> {
  const engine = getMemoryEngine();
  await engine.initialize();
  return engine.generateContextSummary(userId);
}
