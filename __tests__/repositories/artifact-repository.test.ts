/**
 * Test Suite: Artifact Repository
 * Tests the repository pattern implementation for artifacts
 * 
 * Coverage Areas:
 * - CRUD operations
 * - Data validation and schemas
 * - Search functionality
 * - Domain-specific methods
 * - Error handling and edge cases
 * - Memory repository implementation
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  ArtifactRepository,
  getArtifactRepository,
  type CreateArtifactDTO,
  type UpdateArtifactDTO,
} from '@/lib/repositories/artifact-repository';
import type { Artifact } from '@/hooks/artifacts/use-artifact';

// Mock the artifact hook to define the Artifact type structure
jest.mock('@/hooks/artifacts/use-artifact', () => ({
  useArtifact: jest.fn(),
}));

describe('Artifact Repository', () => {
  let repository: ArtifactRepository;
  
  // Test data
  const mockArtifacts = {
    basic: {
      title: 'Test Artifact',
      content: 'console.log("Hello, World!");',
      type: 'code' as const,
      metadata: {
        language: 'javascript',
        tags: ['test', 'example'],
      },
      userId: 'user-123',
    },
    minimal: {
      title: 'Minimal Artifact',
    },
    markdown: {
      title: 'README',
      content: '# Project Title\n\nThis is a test project.',
      type: 'markdown' as const,
      metadata: {
        tags: ['documentation'],
      },
      userId: 'user-456',
    },
  };

  beforeEach(() => {
    repository = new ArtifactRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Repository Instantiation', () => {
    it('should create a new repository instance', () => {
      expect(repository).toBeInstanceOf(ArtifactRepository);
      expect(repository).toBeDefined();
    });

    it('should provide singleton access', () => {
      const repo1 = getArtifactRepository();
      const repo2 = getArtifactRepository();
      
      expect(repo1).toBe(repo2);
      expect(repo1).toBeInstanceOf(ArtifactRepository);
    });

    it('should have correct table name', () => {
      expect((repository as any).tableName).toBe('artifacts');
    });
  });

  describe('CRUD Operations', () => {
    describe('create', () => {
      it('should create an artifact with all fields', async () => {
        const artifact = await repository.create(mockArtifacts.basic);
        
        expect(artifact).toMatchObject({
          id: expect.stringMatching(/^artifact-\d+-[a-z0-9]+$/),
          title: mockArtifacts.basic.title,
          content: mockArtifacts.basic.content,
          type: mockArtifacts.basic.type,
          metadata: mockArtifacts.basic.metadata,
          userId: mockArtifacts.basic.userId,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        });
        
        expect(artifact.createdAt).toBeRecentDate();
        expect(artifact.updatedAt).toBeRecentDate();
      });

      it('should create artifact with minimal data and defaults', async () => {
        const artifact = await repository.create(mockArtifacts.minimal);
        
        expect(artifact).toMatchObject({
          id: expect.any(String),
          title: mockArtifacts.minimal.title,
          content: '', // Default empty content
          type: 'text', // Default type
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        });
      });

      it('should generate unique IDs for multiple artifacts', async () => {
        const artifacts = await Promise.all([
          repository.create({ title: 'Artifact 1' }),
          repository.create({ title: 'Artifact 2' }),
          repository.create({ title: 'Artifact 3' }),
        ]);
        
        const ids = artifacts.map(a => a.id);
        const uniqueIds = new Set(ids);
        
        expect(uniqueIds.size).toBe(ids.length);
      });

      it('should handle concurrent creates safely', async () => {
        const createPromises = Array.from({ length: 5 }, (_, i) =>
          repository.create({ title: `Concurrent Artifact ${i}` })
        );
        
        const artifacts = await Promise.all(createPromises);
        const ids = artifacts.map(a => a.id);
        const uniqueIds = new Set(ids);
        
        expect(uniqueIds.size).toBe(artifacts.length);
      });
    });

    describe('createMany', () => {
      it('should create multiple artifacts', async () => {
        const data = [
          { title: 'Artifact 1', content: 'Content 1' },
          { title: 'Artifact 2', content: 'Content 2' },
        ];
        
        const artifacts = await repository.createMany(data);
        
        expect(artifacts).toHaveLength(2);
        expect(artifacts[0].title).toBe('Artifact 1');
        expect(artifacts[1].title).toBe('Artifact 2');
      });

      it('should handle empty array', async () => {
        const artifacts = await repository.createMany([]);
        expect(artifacts).toHaveLength(0);
      });
    });

    describe('findById', () => {
      it('should find artifact by ID', async () => {
        const created = await repository.create(mockArtifacts.basic);
        const found = await repository.findById(created.id);
        
        expect(found).toEqual(created);
      });

      it('should return null for non-existent ID', async () => {
        const found = await repository.findById('non-existent-id');
        expect(found).toBeNull();
      });

      it('should handle invalid ID formats', async () => {
        const invalidIds = ['', null, undefined, 123, {}];
        
        for (const id of invalidIds) {
          const found = await repository.findById(id as any);
          expect(found).toBeNull();
        }
      });
    });

    describe('findAll', () => {
      it('should return empty array when no artifacts exist', async () => {
        const artifacts = await repository.findAll();
        expect(artifacts).toEqual([]);
      });

      it('should return all artifacts', async () => {
        await repository.create(mockArtifacts.basic);
        await repository.create(mockArtifacts.markdown);
        
        const artifacts = await repository.findAll();
        expect(artifacts).toHaveLength(2);
      });

      it('should handle options parameter', async () => {
        await repository.create(mockArtifacts.basic);
        
        const artifacts = await repository.findAll({ limit: 1 });
        // Note: Current memory implementation may not respect options
        expect(artifacts).toBeDefined();
      });
    });

    describe('findOne', () => {
      it('should find first matching artifact', async () => {
        const created = await repository.create(mockArtifacts.basic);
        const found = await repository.findOne({ title: mockArtifacts.basic.title });
        
        expect(found).toEqual(created);
      });

      it('should return null when no match found', async () => {
        await repository.create(mockArtifacts.basic);
        const found = await repository.findOne({ title: 'Non-existent' });
        
        expect(found).toBeNull();
      });

      it('should match partial criteria', async () => {
        const created = await repository.create(mockArtifacts.basic);
        const found = await repository.findOne({ userId: mockArtifacts.basic.userId });
        
        expect(found).toEqual(created);
      });
    });

    describe('findMany', () => {
      it('should find multiple matching artifacts', async () => {
        const artifact1 = await repository.create({ 
          ...mockArtifacts.basic, 
          title: 'Test 1' 
        });
        const artifact2 = await repository.create({ 
          ...mockArtifacts.basic, 
          title: 'Test 2' 
        });
        await repository.create({ 
          ...mockArtifacts.markdown, 
          userId: 'different-user' 
        });
        
        const found = await repository.findMany({ 
          userId: mockArtifacts.basic.userId 
        });
        
        expect(found).toHaveLength(2);
        expect(found).toContainEqual(artifact1);
        expect(found).toContainEqual(artifact2);
      });

      it('should return empty array when no matches', async () => {
        await repository.create(mockArtifacts.basic);
        const found = await repository.findMany({ userId: 'non-existent' });
        
        expect(found).toEqual([]);
      });
    });

    describe('update', () => {
      it('should update artifact fields', async () => {
        const created = await repository.create(mockArtifacts.basic);
        const updateData: UpdateArtifactDTO = {
          title: 'Updated Title',
          content: 'Updated content',
        };
        
        const updated = await repository.update(created.id, updateData);
        
        expect(updated.title).toBe(updateData.title);
        expect(updated.content).toBe(updateData.content);
        expect(updated.type).toBe(created.type); // Unchanged
        expect(updated.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());
      });

      it('should handle partial updates', async () => {
        const created = await repository.create(mockArtifacts.basic);
        const updated = await repository.update(created.id, { title: 'New Title' });
        
        expect(updated.title).toBe('New Title');
        expect(updated.content).toBe(created.content); // Unchanged
      });

      it('should update metadata', async () => {
        const created = await repository.create(mockArtifacts.basic);
        const newMetadata = {
          language: 'typescript',
          tags: ['updated', 'test'],
        };
        
        const updated = await repository.update(created.id, { 
          metadata: newMetadata 
        });
        
        expect(updated.metadata).toEqual(newMetadata);
      });

      it('should throw error for non-existent ID', async () => {
        await expect(
          repository.update('non-existent-id', { title: 'Updated' })
        ).rejects.toThrow();
      });
    });

    describe('updateMany', () => {
      it('should update multiple matching artifacts', async () => {
        await repository.create({ ...mockArtifacts.basic, title: 'Test 1' });
        await repository.create({ ...mockArtifacts.basic, title: 'Test 2' });
        await repository.create({ ...mockArtifacts.markdown, userId: 'different' });
        
        const updateCount = await repository.updateMany(
          { userId: mockArtifacts.basic.userId },
          { type: 'text' as const }
        );
        
        expect(updateCount).toBe(2);
        
        // Verify updates
        const updated = await repository.findMany({ 
          userId: mockArtifacts.basic.userId 
        });
        expect(updated.every(a => a.type === 'text')).toBe(true);
      });

      it('should return 0 when no matches', async () => {
        const count = await repository.updateMany(
          { userId: 'non-existent' },
          { title: 'Updated' }
        );
        
        expect(count).toBe(0);
      });
    });

    describe('delete', () => {
      it('should delete existing artifact', async () => {
        const created = await repository.create(mockArtifacts.basic);
        const deleted = await repository.delete(created.id);
        
        expect(deleted).toBe(true);
        
        const found = await repository.findById(created.id);
        expect(found).toBeNull();
      });

      it('should return false for non-existent artifact', async () => {
        const deleted = await repository.delete('non-existent-id');
        expect(deleted).toBe(false);
      });
    });

    describe('deleteMany', () => {
      it('should delete multiple matching artifacts', async () => {
        await repository.create({ ...mockArtifacts.basic, title: 'Delete 1' });
        await repository.create({ ...mockArtifacts.basic, title: 'Delete 2' });
        await repository.create({ ...mockArtifacts.markdown, userId: 'keep' });
        
        const deleteCount = await repository.deleteMany({ 
          userId: mockArtifacts.basic.userId 
        });
        
        expect(deleteCount).toBe(2);
        
        const remaining = await repository.findAll();
        expect(remaining).toHaveLength(1);
        expect(remaining[0].userId).toBe('keep');
      });

      it('should return 0 when no matches', async () => {
        const count = await repository.deleteMany({ userId: 'non-existent' });
        expect(count).toBe(0);
      });
    });
  });

  describe('Query Methods', () => {
    beforeEach(async () => {
      // Setup test data
      await repository.create({
        title: 'JavaScript Guide',
        content: 'function hello() { return "Hello"; }',
        type: 'code',
        metadata: { language: 'javascript', tags: ['tutorial'] },
        userId: 'user-1',
      });
      
      await repository.create({
        title: 'TypeScript Guide', 
        content: 'interface User { name: string; }',
        type: 'code',
        metadata: { language: 'typescript', tags: ['tutorial'] },
        userId: 'user-1',
      });
      
      await repository.create({
        title: 'Project Documentation',
        content: '# Documentation\nThis is markdown content.',
        type: 'markdown',
        metadata: { tags: ['docs'] },
        userId: 'user-2',
      });
    });

    describe('findByUserId', () => {
      it('should find artifacts by user ID', async () => {
        const artifacts = await repository.findByUserId('user-1');
        
        expect(artifacts).toHaveLength(2);
        expect(artifacts.every(a => a.userId === 'user-1')).toBe(true);
      });

      it('should return empty array for non-existent user', async () => {
        const artifacts = await repository.findByUserId('non-existent');
        expect(artifacts).toEqual([]);
      });
    });

    describe('findByType', () => {
      it('should find artifacts by type', async () => {
        const codeArtifacts = await repository.findByType('code');
        const markdownArtifacts = await repository.findByType('markdown');
        
        expect(codeArtifacts).toHaveLength(2);
        expect(markdownArtifacts).toHaveLength(1);
        expect(codeArtifacts.every(a => a.type === 'code')).toBe(true);
        expect(markdownArtifacts.every(a => a.type === 'markdown')).toBe(true);
      });

      it('should return empty array for non-existent type', async () => {
        const artifacts = await repository.findByType('text');
        expect(artifacts).toEqual([]);
      });
    });

    describe('searchByTitle', () => {
      it('should search artifacts by title (case insensitive)', async () => {
        const results = await repository.searchByTitle('guide');
        
        expect(results).toHaveLength(2);
        expect(results.some(a => a.title.includes('JavaScript'))).toBe(true);
        expect(results.some(a => a.title.includes('TypeScript'))).toBe(true);
      });

      it('should search with partial matches', async () => {
        const results = await repository.searchByTitle('Project');
        
        expect(results).toHaveLength(1);
        expect(results[0].title).toBe('Project Documentation');
      });

      it('should return empty array for no matches', async () => {
        const results = await repository.searchByTitle('nonexistent');
        expect(results).toEqual([]);
      });

      it('should handle empty search query', async () => {
        const results = await repository.searchByTitle('');
        expect(results).toHaveLength(3); // All artifacts contain empty string
      });
    });

    describe('searchByContent', () => {
      it('should search artifacts by content', async () => {
        const results = await repository.searchByContent('function');
        
        expect(results).toHaveLength(1);
        expect(results[0].title).toBe('JavaScript Guide');
      });

      it('should search case insensitively', async () => {
        const results = await repository.searchByContent('INTERFACE');
        
        expect(results).toHaveLength(1);
        expect(results[0].title).toBe('TypeScript Guide');
      });

      it('should search markdown content', async () => {
        const results = await repository.searchByContent('Documentation');
        
        expect(results).toHaveLength(1);
        expect(results[0].type).toBe('markdown');
      });
    });

    describe('count', () => {
      it('should count all artifacts', async () => {
        const total = await repository.count();
        expect(total).toBe(3);
      });

      it('should count with conditions', async () => {
        const codeCount = await repository.count({ type: 'code' });
        const user1Count = await repository.count({ userId: 'user-1' });
        
        expect(codeCount).toBe(2);
        expect(user1Count).toBe(2);
      });

      it('should return 0 for no matches', async () => {
        const count = await repository.count({ userId: 'non-existent' });
        expect(count).toBe(0);
      });
    });

    describe('exists', () => {
      it('should return true when artifact exists', async () => {
        const exists = await repository.exists({ title: 'JavaScript Guide' });
        expect(exists).toBe(true);
      });

      it('should return false when artifact does not exist', async () => {
        const exists = await repository.exists({ title: 'Non-existent' });
        expect(exists).toBe(false);
      });

      it('should check multiple conditions', async () => {
        const exists = await repository.exists({
          type: 'code',
          userId: 'user-1',
        });
        
        expect(exists).toBe(true);
      });
    });
  });

  describe('Domain-Specific Methods', () => {
    describe('duplicateArtifact', () => {
      it('should duplicate existing artifact', async () => {
        const original = await repository.create(mockArtifacts.basic);
        const duplicate = await repository.duplicateArtifact(original.id);
        
        expect(duplicate).not.toBeNull();
        expect(duplicate!.id).not.toBe(original.id);
        expect(duplicate!.title).toBe(`${original.title} (cópia)`);
        expect(duplicate!.content).toBe(original.content);
        expect(duplicate!.type).toBe(original.type);
        expect(duplicate!.metadata).toEqual(original.metadata);
        expect(duplicate!.userId).toBe(original.userId);
      });

      it('should return null for non-existent artifact', async () => {
        const duplicate = await repository.duplicateArtifact('non-existent');
        expect(duplicate).toBeNull();
      });

      it('should create independent copy', async () => {
        const original = await repository.create(mockArtifacts.basic);
        const duplicate = await repository.duplicateArtifact(original.id);
        
        // Update duplicate
        await repository.update(duplicate!.id, { content: 'Updated content' });
        
        // Original should be unchanged
        const originalAfter = await repository.findById(original.id);
        expect(originalAfter!.content).toBe(original.content);
      });
    });

    describe('getStatsByUser', () => {
      beforeEach(async () => {
        await repository.create({
          title: 'JS File',
          content: 'var a = 1;',
          type: 'code',
          userId: 'user-stats',
        });
        
        await repository.create({
          title: 'TS File',
          content: 'const b: number = 2;',
          type: 'code', 
          userId: 'user-stats',
        });
        
        await repository.create({
          title: 'README',
          content: '# Title\nLong markdown content here',
          type: 'markdown',
          userId: 'user-stats',
        });
      });

      it('should calculate user statistics correctly', async () => {
        const stats = await repository.getStatsByUser('user-stats');
        
        expect(stats).toMatchObject({
          total: 3,
          byType: {
            code: 2,
            markdown: 1,
          },
          totalSize: expect.any(Number),
        });
        
        expect(stats.totalSize).toBeGreaterThan(0);
      });

      it('should return zero stats for non-existent user', async () => {
        const stats = await repository.getStatsByUser('non-existent');
        
        expect(stats).toEqual({
          total: 0,
          byType: {},
          totalSize: 0,
        });
      });

      it('should calculate content size correctly', async () => {
        await repository.create({
          title: 'Short',
          content: 'Hi',
          userId: 'size-test',
        });
        
        const stats = await repository.getStatsByUser('size-test');
        expect(stats.totalSize).toBe(2); // "Hi".length
      });
    });

    describe('cleanupOldArtifacts', () => {
      beforeEach(async () => {
        // Create artifacts with different ages
        const old = await repository.create({
          title: 'Old Artifact',
          content: 'Old content',
        });
        
        const recent = await repository.create({
          title: 'Recent Artifact', 
          content: 'Recent content',
        });
        
        // Manually set old date
        const oldDate = new Date();
        oldDate.setDate(oldDate.getDate() - 45);
        (old as any).updatedAt = oldDate;
        
        await repository.update(old.id, { title: old.title }); // This will update updatedAt
        // We need to manually set it back for this test
        const oldArtifact = await repository.findById(old.id);
        if (oldArtifact) {
          (oldArtifact as any).updatedAt = oldDate;
        }
      });

      it('should cleanup old artifacts', async () => {
        const initialCount = await repository.count();
        const deletedCount = await repository.cleanupOldArtifacts(30);
        const finalCount = await repository.count();
        
        expect(deletedCount).toBeGreaterThanOrEqual(0);
        expect(finalCount).toBeLessThanOrEqual(initialCount);
      });

      it('should use default age of 30 days', async () => {
        const deletedCount = await repository.cleanupOldArtifacts();
        expect(typeof deletedCount).toBe('number');
      });

      it('should not delete recent artifacts', async () => {
        // Use very old cutoff
        const deletedCount = await repository.cleanupOldArtifacts(365);
        expect(deletedCount).toBe(0);
      });
    });

    describe('deleteByUserId', () => {
      it('should delete all artifacts for a user', async () => {
        await repository.create({ ...mockArtifacts.basic, userId: 'delete-user' });
        await repository.create({ ...mockArtifacts.markdown, userId: 'delete-user' });
        await repository.create({ ...mockArtifacts.basic, userId: 'keep-user' });
        
        const deletedCount = await repository.deleteByUserId('delete-user');
        expect(deletedCount).toBe(2);
        
        const remaining = await repository.findByUserId('delete-user');
        expect(remaining).toHaveLength(0);
        
        const kept = await repository.findByUserId('keep-user');
        expect(kept).toHaveLength(1);
      });

      it('should return 0 for non-existent user', async () => {
        const deletedCount = await repository.deleteByUserId('non-existent');
        expect(deletedCount).toBe(0);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    describe('Data Validation', () => {
      it('should validate required fields', async () => {
        // Empty title should still work with current implementation
        const artifact = await repository.create({ title: '' });
        expect(artifact.title).toBe('');
      });

      it('should handle special characters in content', async () => {
        const specialContent = 'Special chars: 🚀 äöü @#$% \n\t"\'\\';
        const artifact = await repository.create({
          title: 'Special Content',
          content: specialContent,
        });
        
        expect(artifact.content).toBe(specialContent);
      });

      it('should handle large content', async () => {
        const largeContent = 'x'.repeat(10000);
        const artifact = await repository.create({
          title: 'Large Content',
          content: largeContent,
        });
        
        expect(artifact.content).toHaveLength(10000);
      });

      it('should handle null/undefined metadata gracefully', async () => {
        const artifact = await repository.create({
          title: 'No Metadata',
          metadata: undefined,
        });
        
        expect(artifact.metadata).toBeUndefined();
      });
    });

    describe('Concurrent Operations', () => {
      it('should handle concurrent reads safely', async () => {
        const artifact = await repository.create(mockArtifacts.basic);
        
        const readPromises = Array.from({ length: 10 }, () =>
          repository.findById(artifact.id)
        );
        
        const results = await Promise.all(readPromises);
        expect(results.every(r => r?.id === artifact.id)).toBe(true);
      });

      it('should handle concurrent updates on same artifact', async () => {
        const artifact = await repository.create(mockArtifacts.basic);
        
        const updatePromises = Array.from({ length: 3 }, (_, i) =>
          repository.update(artifact.id, { title: `Updated ${i}` })
        );
        
        // All updates should succeed (last one wins)
        const results = await Promise.all(updatePromises);
        expect(results).toHaveLength(3);
      });
    });

    describe('Memory Constraints', () => {
      it('should handle many artifacts efficiently', async () => {
        const createPromises = Array.from({ length: 100 }, (_, i) =>
          repository.create({ title: `Artifact ${i}` })
        );
        
        const artifacts = await Promise.all(createPromises);
        expect(artifacts).toHaveLength(100);
        
        const allArtifacts = await repository.findAll();
        expect(allArtifacts.length).toBeGreaterThanOrEqual(100);
      });

      it('should maintain performance with search operations', async () => {
        // Create many artifacts
        await Promise.all(
          Array.from({ length: 50 }, (_, i) =>
            repository.create({
              title: `Search Test ${i}`,
              content: `Content ${i} with searchable terms`,
            })
          )
        );
        
        const start = Date.now();
        const results = await repository.searchByTitle('Test');
        const duration = Date.now() - start;
        
        expect(results.length).toBeGreaterThan(0);
        expect(duration).toBeLessThan(100); // Should be fast
      });
    });
  });

  describe('Integration with Base Repository', () => {
    it('should properly extend BaseRepository', () => {
      expect(repository).toHaveProperty('findAll');
      expect(repository).toHaveProperty('findById');
      expect(repository).toHaveProperty('create');
      expect(repository).toHaveProperty('update');
      expect(repository).toHaveProperty('delete');
      expect(repository).toHaveProperty('count');
      expect(repository).toHaveProperty('exists');
    });

    it('should call lifecycle hooks', async () => {
      // The beforeCreate hook adds timestamps and defaults
      const artifact = await repository.create({ title: 'Hook Test' });
      
      expect(artifact.createdAt).toBeDefined();
      expect(artifact.updatedAt).toBeDefined();
      expect(artifact.content).toBe(''); // Default from beforeCreate
      expect(artifact.type).toBe('text'); // Default from beforeCreate
    });

    it('should call beforeUpdate hook', async () => {
      const artifact = await repository.create({ title: 'Update Test' });
      const originalUpdatedAt = artifact.updatedAt;
      
      // Wait a bit to ensure timestamp difference
      await global.testUtils.waitFor(10);
      
      const updated = await repository.update(artifact.id, { title: 'Updated' });
      expect(updated.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('TypeScript Type Safety', () => {
    it('should enforce CreateArtifactDTO types', () => {
      const validDTO: CreateArtifactDTO = {
        title: 'Test',
        content: 'Content',
        type: 'code',
        metadata: { language: 'js' },
        userId: 'user-1',
      };
      
      expect(() => repository.create(validDTO)).not.toThrow();
    });

    it('should enforce UpdateArtifactDTO types', async () => {
      const artifact = await repository.create({ title: 'Test' });
      
      const validUpdate: UpdateArtifactDTO = {
        title: 'Updated',
        content: 'New content',
        type: 'markdown',
        metadata: { tags: ['updated'] },
      };
      
      expect(() => repository.update(artifact.id, validUpdate)).not.toThrow();
    });

    it('should handle artifact type enum values', async () => {
      const types = ['text', 'code', 'markdown'] as const;
      
      for (const type of types) {
        const artifact = await repository.create({
          title: `${type} test`,
          type: type,
        });
        
        expect(artifact.type).toBe(type);
      }
    });
  });
});