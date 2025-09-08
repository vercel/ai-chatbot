/**
 * Padrão Repository para abstração de banco de dados
 * Facilita manutenção e testes
 */

import { z } from 'zod';

export interface QueryOptions {
  where?: Record<string, any>;
  orderBy?: Record<string, 'asc' | 'desc'>;
  limit?: number;
  offset?: number;
  include?: string[];
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Interface base para todos os repositories
 */
export interface IRepository<T, CreateDTO = Partial<T>, UpdateDTO = Partial<T>> {
  findAll(options?: QueryOptions): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  findOne(where: Partial<T>): Promise<T | null>;
  findMany(where: Partial<T>, options?: QueryOptions): Promise<T[]>;
  findPaginated(options: PaginationOptions & QueryOptions): Promise<PaginatedResult<T>>;
  
  create(data: CreateDTO): Promise<T>;
  createMany(data: CreateDTO[]): Promise<T[]>;
  
  update(id: string, data: UpdateDTO): Promise<T>;
  updateMany(where: Partial<T>, data: UpdateDTO): Promise<number>;
  
  delete(id: string): Promise<boolean>;
  deleteMany(where: Partial<T>): Promise<number>;
  
  count(where?: Partial<T>): Promise<number>;
  exists(where: Partial<T>): Promise<boolean>;
}

/**
 * Classe base abstrata para repositories
 */
export abstract class BaseRepository<T, CreateDTO = Partial<T>, UpdateDTO = Partial<T>> 
  implements IRepository<T, CreateDTO, UpdateDTO> {
  
  protected abstract tableName: string;
  protected abstract schema: z.ZodType<T>;
  
  /**
   * Valida dados com schema Zod
   */
  protected validate(data: any): T {
    return this.schema.parse(data);
  }
  
  /**
   * Valida array de dados
   */
  protected validateMany(data: any[]): T[] {
    return data.map(item => this.validate(item));
  }
  
  /**
   * Hook executado antes de criar
   */
  protected async beforeCreate(data: CreateDTO): Promise<CreateDTO> {
    return data;
  }
  
  /**
   * Hook executado após criar
   */
  protected async afterCreate(entity: T): Promise<T> {
    return entity;
  }
  
  /**
   * Hook executado antes de atualizar
   */
  protected async beforeUpdate(id: string, data: UpdateDTO): Promise<UpdateDTO> {
    return data;
  }
  
  /**
   * Hook executado após atualizar
   */
  protected async afterUpdate(entity: T): Promise<T> {
    return entity;
  }
  
  /**
   * Hook executado antes de deletar
   */
  protected async beforeDelete(id: string): Promise<void> {
    // Override se necessário
  }
  
  /**
   * Hook executado após deletar
   */
  protected async afterDelete(id: string): Promise<void> {
    // Override se necessário
  }
  
  // Implementações abstratas que devem ser definidas nas subclasses
  abstract findAll(options?: QueryOptions): Promise<T[]>;
  abstract findById(id: string): Promise<T | null>;
  abstract findOne(where: Partial<T>): Promise<T | null>;
  abstract findMany(where: Partial<T>, options?: QueryOptions): Promise<T[]>;
  abstract findPaginated(options: PaginationOptions & QueryOptions): Promise<PaginatedResult<T>>;
  abstract create(data: CreateDTO): Promise<T>;
  abstract createMany(data: CreateDTO[]): Promise<T[]>;
  abstract update(id: string, data: UpdateDTO): Promise<T>;
  abstract updateMany(where: Partial<T>, data: UpdateDTO): Promise<number>;
  abstract delete(id: string): Promise<boolean>;
  abstract deleteMany(where: Partial<T>): Promise<number>;
  abstract count(where?: Partial<T>): Promise<number>;
  abstract exists(where: Partial<T>): Promise<boolean>;
}

/**
 * Repository em memória para testes
 */
export class InMemoryRepository<T extends { id: string }, CreateDTO = Partial<T>, UpdateDTO = Partial<T>> 
  extends BaseRepository<T, CreateDTO, UpdateDTO> {
  
  protected tableName = 'memory';
  protected schema: z.ZodType<T>;
  private data: Map<string, T> = new Map();
  private idCounter = 1;
  
  constructor(schema: z.ZodType<T>) {
    super();
    this.schema = schema;
  }
  
  async findAll(options?: QueryOptions): Promise<T[]> {
    let result = Array.from(this.data.values());
    
    if (options?.where) {
      result = result.filter(item => 
        Object.entries(options.where!).every(([key, value]) => 
          (item as any)[key] === value
        )
      );
    }
    
    if (options?.orderBy) {
      const [field, order] = Object.entries(options.orderBy)[0];
      result.sort((a, b) => {
        const aVal = (a as any)[field];
        const bVal = (b as any)[field];
        return order === 'asc' ? 
          (aVal > bVal ? 1 : -1) : 
          (aVal < bVal ? 1 : -1);
      });
    }
    
    if (options?.offset) {
      result = result.slice(options.offset);
    }
    
    if (options?.limit) {
      result = result.slice(0, options.limit);
    }
    
    return result;
  }
  
  async findById(id: string): Promise<T | null> {
    return this.data.get(id) || null;
  }
  
  async findOne(where: Partial<T>): Promise<T | null> {
    const results = await this.findMany(where, { limit: 1 });
    return results[0] || null;
  }
  
  async findMany(where: Partial<T>, options?: QueryOptions): Promise<T[]> {
    return this.findAll({ ...options, where: where as any });
  }
  
  async findPaginated(options: PaginationOptions & QueryOptions): Promise<PaginatedResult<T>> {
    const { page, pageSize, ...queryOptions } = options;
    const offset = (page - 1) * pageSize;
    
    const total = await this.count(queryOptions.where);
    const data = await this.findAll({
      ...queryOptions,
      offset,
      limit: pageSize,
    });
    
    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
  
  async create(data: CreateDTO): Promise<T> {
    const processedData = await this.beforeCreate(data);
    const id = `${this.idCounter++}`;
    const entity = this.validate({ ...processedData, id } as T);
    this.data.set(id, entity);
    return this.afterCreate(entity);
  }
  
  async createMany(data: CreateDTO[]): Promise<T[]> {
    const results: T[] = [];
    for (const item of data) {
      results.push(await this.create(item));
    }
    return results;
  }
  
  async update(id: string, data: UpdateDTO): Promise<T> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Entity with id ${id} not found`);
    }
    
    const processedData = await this.beforeUpdate(id, data);
    const updated = this.validate({ ...existing, ...processedData });
    this.data.set(id, updated);
    return this.afterUpdate(updated);
  }
  
  async updateMany(where: Partial<T>, data: UpdateDTO): Promise<number> {
    const items = await this.findMany(where);
    let count = 0;
    
    for (const item of items) {
      await this.update(item.id, data);
      count++;
    }
    
    return count;
  }
  
  async delete(id: string): Promise<boolean> {
    await this.beforeDelete(id);
    const result = this.data.delete(id);
    if (result) {
      await this.afterDelete(id);
    }
    return result;
  }
  
  async deleteMany(where: Partial<T>): Promise<number> {
    const items = await this.findMany(where);
    let count = 0;
    
    for (const item of items) {
      if (await this.delete(item.id)) {
        count++;
      }
    }
    
    return count;
  }
  
  async count(where?: Partial<T>): Promise<number> {
    if (!where) {
      return this.data.size;
    }
    
    const items = await this.findMany(where);
    return items.length;
  }
  
  async exists(where: Partial<T>): Promise<boolean> {
    const item = await this.findOne(where);
    return item !== null;
  }
}

// Exportar tipos úteis
export type Repository<T> = IRepository<T>;
export type CreateDTO<T> = Partial<T>;
export type UpdateDTO<T> = Partial<T>;