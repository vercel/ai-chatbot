/**
 * Repository para Artifacts
 * Exemplo de implementação do padrão Repository
 */

import { z } from 'zod';
import { BaseRepository, InMemoryRepository } from './base-repository';
import type { Artifact } from '@/hooks/artifacts/use-artifact';

// Schema de validação
const artifactSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  type: z.enum(['text', 'code', 'markdown']),
  createdAt: z.date(),
  updatedAt: z.date(),
  metadata: z.object({
    language: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
  userId: z.string().optional(),
});

// DTOs
export interface CreateArtifactDTO {
  title: string;
  content?: string;
  type?: 'text' | 'code' | 'markdown';
  metadata?: {
    language?: string;
    tags?: string[];
  };
  userId?: string;
}

export interface UpdateArtifactDTO {
  title?: string;
  content?: string;
  type?: 'text' | 'code' | 'markdown';
  metadata?: {
    language?: string;
    tags?: string[];
  };
}

/**
 * Repository para Artifacts usando PostgreSQL (Drizzle)
 */
export class ArtifactRepository extends BaseRepository<Artifact, CreateArtifactDTO, UpdateArtifactDTO> {
  protected tableName = 'artifacts';
  protected schema = artifactSchema;
  
  // Por enquanto, usar implementação em memória
  // Em produção, substituir por Drizzle ORM
  private memoryRepo: InMemoryRepository<Artifact & { id: string }>;
  
  constructor() {
    super();
    this.memoryRepo = new InMemoryRepository(artifactSchema as any);
  }
  
  async findAll(options?: any): Promise<Artifact[]> {
    return this.memoryRepo.findAll(options);
  }
  
  async findById(id: string): Promise<Artifact | null> {
    return this.memoryRepo.findById(id);
  }
  
  async findOne(where: Partial<Artifact>): Promise<Artifact | null> {
    return this.memoryRepo.findOne(where);
  }
  
  async findMany(where: Partial<Artifact>, options?: any): Promise<Artifact[]> {
    return this.memoryRepo.findMany(where, options);
  }
  
  async findPaginated(options: any): Promise<any> {
    return this.memoryRepo.findPaginated(options);
  }
  
  async findByUserId(userId: string): Promise<Artifact[]> {
    return this.findMany({ userId } as any);
  }
  
  async findByType(type: Artifact['type']): Promise<Artifact[]> {
    return this.findMany({ type } as any);
  }
  
  async searchByTitle(query: string): Promise<Artifact[]> {
    const all = await this.findAll();
    return all.filter(artifact => 
      artifact.title.toLowerCase().includes(query.toLowerCase())
    );
  }
  
  async searchByContent(query: string): Promise<Artifact[]> {
    const all = await this.findAll();
    return all.filter(artifact => 
      artifact.content.toLowerCase().includes(query.toLowerCase())
    );
  }
  
  protected async beforeCreate(data: CreateArtifactDTO): Promise<CreateArtifactDTO> {
    // Adicionar timestamps
    const now = new Date();
    return {
      ...data,
      content: data.content || '',
      type: data.type || 'text',
      createdAt: now,
      updatedAt: now,
    } as any;
  }
  
  protected async beforeUpdate(id: string, data: UpdateArtifactDTO): Promise<UpdateArtifactDTO> {
    // Atualizar timestamp
    return {
      ...data,
      updatedAt: new Date(),
    } as any;
  }
  
  async create(data: CreateArtifactDTO): Promise<Artifact> {
    const id = `artifact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return this.memoryRepo.create({ ...data, id } as any);
  }
  
  async createMany(data: CreateArtifactDTO[]): Promise<Artifact[]> {
    return this.memoryRepo.createMany(data as any);
  }
  
  async update(id: string, data: UpdateArtifactDTO): Promise<Artifact> {
    return this.memoryRepo.update(id, data);
  }
  
  async updateMany(where: Partial<Artifact>, data: UpdateArtifactDTO): Promise<number> {
    return this.memoryRepo.updateMany(where, data);
  }
  
  async delete(id: string): Promise<boolean> {
    return this.memoryRepo.delete(id);
  }
  
  async deleteMany(where: Partial<Artifact>): Promise<number> {
    return this.memoryRepo.deleteMany(where);
  }
  
  async deleteByUserId(userId: string): Promise<number> {
    return this.deleteMany({ userId } as any);
  }
  
  async count(where?: Partial<Artifact>): Promise<number> {
    return this.memoryRepo.count(where);
  }
  
  async exists(where: Partial<Artifact>): Promise<boolean> {
    return this.memoryRepo.exists(where);
  }
  
  /**
   * Métodos específicos do domínio
   */
  
  async duplicateArtifact(id: string): Promise<Artifact | null> {
    const original = await this.findById(id);
    if (!original) return null;
    
    const copy = await this.create({
      title: `${original.title} (cópia)`,
      content: original.content,
      type: original.type,
      metadata: original.metadata,
      userId: original.userId,
    });
    
    return copy;
  }
  
  async getStatsByUser(userId: string): Promise<{
    total: number;
    byType: Record<string, number>;
    totalSize: number;
  }> {
    const artifacts = await this.findByUserId(userId);
    
    const stats = {
      total: artifacts.length,
      byType: {} as Record<string, number>,
      totalSize: 0,
    };
    
    for (const artifact of artifacts) {
      stats.byType[artifact.type] = (stats.byType[artifact.type] || 0) + 1;
      stats.totalSize += artifact.content.length;
    }
    
    return stats;
  }
  
  async cleanupOldArtifacts(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const old = await this.findAll();
    const toDelete = old.filter(a => a.updatedAt < cutoffDate);
    
    let deleted = 0;
    for (const artifact of toDelete) {
      if (await this.delete(artifact.id)) {
        deleted++;
      }
    }
    
    return deleted;
  }
}

// Singleton instance
let artifactRepository: ArtifactRepository | null = null;

export function getArtifactRepository(): ArtifactRepository {
  if (!artifactRepository) {
    artifactRepository = new ArtifactRepository();
  }
  return artifactRepository;
}

// Exportar instância padrão
export default getArtifactRepository();