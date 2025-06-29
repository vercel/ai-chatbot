## Tasks

- [x] 1.0 Setup Project Structure and Dependencies
  - [x] 1.1 Create `/indexer` directory structure
  - [x] 1.2 Update package.json with required dependencies (commander, etc.)
  - [x] 1.3 Create main entry point file `indexer/index.ts` with basic structure
  - [x] 1.4 Set up TypeScript configuration for the indexer module
- [x] 2.0 Define and Migrate Database Schema
  - [x] 2.1 Examine existing database schema structure and patterns
  - [x] 2.2 Define Resources table schema in Drizzle
  - [x] 2.3 Define ResourceChunks table schema with pgvector support
  - [x] 2.4 Generate and run Drizzle migration
- [x] 3.0 Implement Command-Line Interface and Data Source Abstraction
  - [x] 3.1 Create abstract DataSource interface and base classes
  - [x] 3.2 Implement FileSystemDataSource for local markdown files
  - [x] 3.3 Create placeholder URLDataSource and GitHubDataSource classes
  - [x] 3.4 Update CLI to use data source abstraction
- [x] 4.0 Refactor Data Source to Use Generators
  - [x] 4.1 Update `DataSource` interface in `indexer/types.ts` to use an async generator for `discoverDocuments`.
  - [x] 4.2 Update `FileSystemDataSource` to implement the generator pattern for discovering documents.
  - [x] 4.3 Update `URLDataSource` and `GitHubDataSource` placeholders to align with the new generator interface.
  - [x] 4.4 Modify `indexDataSource` in `indexer/index.ts` to consume the document stream from the generator.
- [x] 5.0 Implement File System Indexing Logic
  - [x] 5.1 Add langchain dependency for text splitting
  - [x] 5.2 Create database query functions for Resources and ResourceChunks tables
  - [x] 5.3 Implement indexing utilities (text chunking, embedding generation)
  - [x] 5.4 Implement complete document processing pipeline
  - [x] 5.5 Add change detection and incremental indexing
  - [x] 5.6 Implement deletion handling for removed files
- [x] 6.0 Implement Database Operations and Deletion Handling
  - [x] 6.1 Database operations (covered in 5.2 - implemented in lib/db/queries.ts)
  - [x] 6.2 Deletion handling (covered in 5.6 - implemented in indexer/index.ts)

## Relevant Files

- `indexer/` - Main indexer directory (created)
- `package.json` - Added commander, langchain dependencies and indexer script
- `indexer/index.ts` - Complete CLI with document processing pipeline and indexing logic
- `indexer/utils.ts` - Text chunking, embedding generation, and indexing utilities
- `tsconfig.json` - Existing TypeScript configuration works for indexer module
- `lib/db/schema.ts` - Added Resources and ResourceChunks tables with pgvector support
- `lib/db/queries.ts` - Added database query functions for Resources and ResourceChunks
- `lib/db/migrations/0007_volatile_epoch.sql` - Custom migration to enable pgvector extension
- `lib/db/migrations/0008_spicy_aqueduct.sql` - Migration for Resources and ResourceChunks tables
- `indexer/types.ts` - Data source interfaces and abstract classes
- `indexer/data-sources/file-system.ts` - FileSystemDataSource implementation
- `indexer/data-sources/url.ts` - URLDataSource placeholder implementation
- `indexer/data-sources/github.ts` - GitHubDataSource placeholder implementation
- `indexer/data-sources/index.ts` - Data source exports
