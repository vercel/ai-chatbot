# PRD: RAG Indexing Service

## 1. Introduction/Overview

This document outlines the requirements for a standalone indexing service. This service is responsible for processing documents from various sources, generating vector embeddings, and storing them in a database. This will serve as the knowledge base for a Retrieval-Augmented Generation (RAG) chatbot, enabling it to answer questions based on the indexed content.

The primary goal is to create a flexible and efficient node script that can be run to build and maintain this knowledge base. Initially, it will support indexing local markdown files, with a clear path to extend functionality to include web URLs and GitHub repositories.

## 2. Goals

- Implement a command-line node script for creating and managing a vector index.
- Support indexing of local `.md` and `.mdx` files from a specified directory.
- Establish an extensible architecture (e.g., using interfaces or abstract classes) to easily incorporate new data sources like URLs and GitHub repositories in the future.
- Integrate with the project's existing Drizzle ORM and PostgreSQL database setup, using the `pgvector` extension.
- Ensure the indexing process is idempotent; it should only process and update documents that are new or have been modified since the last run.
- Automatically detect and remove documents from the index if their source files are deleted.
- Utilize the Vercel `ai` package and OpenAI's `text-embedding-ada-002` model for text embedding.
- All new code for this feature will be located in a new `/indexer` directory.

## 3. User Stories

- **As a developer,** I want to run a script from the command line to index all markdown files in a specific directory so that the content is available to the RAG chatbot.
- **As a developer,** I want the script to efficiently re-index only the files that have changed to save time and reduce API costs.
- **As a developer,** I want the script to automatically clean up the index by removing entries for deleted files, ensuring the knowledge base remains current.
- **As a developer,** I want the database schema for the index to be managed via Drizzle migrations to maintain consistency with the existing project structure.

## 4. Functional Requirements

1.  **Project Structure:** A new directory named `/indexer` will be created in the project root.
2.  **Script Entrypoint:** The main script will be `indexer/index.ts`.
3.  **Command-Line Interface:** The script must accept one of the following mutually exclusive arguments:
    - `--path <directory_path>`: Specifies the local directory to index.
    - `--url <url>`: A placeholder for indexing a web page (to be implemented later).
    - `--repo-url <github_repo_url>`: A placeholder for indexing a GitHub repository (to be implemented later).
4.  **File Discovery:** When using `--path`, the script will recursively find all `.md` and `.mdx` files within the given directory.
5.  **Data Source Abstraction:** An abstraction layer will be implemented to handle different sources. Initially, only the file system source will be fully developed.
6.  **Change Detection:** For each file, a content hash (SHA256) will be computed. This hash will be compared against a stored hash to determine if the file's content has changed.
7.  **Text Chunking:** If a file is new or has been modified, its content will be split into chunks using a recursive character text splitter. The configuration will be a chunk size of 1000 characters with an overlap of 200 characters.
8.  **Embedding Generation:** Each chunk will be converted into a vector embedding using OpenAI's `text-embedding-ada-002` model via the Vercel `ai` library.
9.  **Deletion Handling:** When indexing a directory, the script will identify and delete records (both the parent resource and its chunks) from the database that correspond to files no longer present in the directory.
10. **Database Schema:** New Drizzle schema definitions will be created in a file under `lib/db/schema.ts` (or a new file if preferred).
11. **`Resources` Table:**
    - `id`: `uuid` (Primary Key)
    - `source_type`: `text` (e.g., 'file', 'url', 'github')
    - `source_uri`: `text` (unique identifier, e.g., the file path)
    - `content_hash`: `text`
    - `createdAt`: `timestamp`
    - `updatedAt`: `timestamp`
12. **`ResourceChunks` Table:**
    - `id`: `uuid` (Primary Key)
    - `resource_id`: `uuid` (Foreign Key to `Resources.id`, with `onDelete: 'cascade'`)
    - `content`: `text` (The text content of the chunk)
    - `embedding`: `vector(1536)` (The embedding vector)
13. **Database Migration:** A new Drizzle migration file will be generated to apply these schema changes to the database.

## 5. Non-Goals (Out of Scope)

- The full implementation of the URL and GitHub repository data sources.
- Any modifications to the existing chatbot application to query or utilize the indexed data.
- A user interface for managing the indexed content.
- Support for file types other than markdown (`.md`, `.mdx`).
- Intra-file diffing for incremental updates; if a file changes, the entire file is re-processed.

## 6. Technical Considerations

- **Dependencies:** A library for parsing command-line arguments, such as `commander`, will be added to `package.json`.
- **Database:** The script assumes that the `pgvector` extension is enabled on the target PostgreSQL database. The Drizzle schema will use the `vector` type from `drizzle-orm/pg-core`.
- **Environment:** The script will require `OPENAI_API_KEY` and the database connection string to be available as environment variables.
- **Hashing:** Node.js's built-in `crypto` module will be used to generate content hashes.

## 7. Success Metrics

- The script executes successfully when pointed at a directory of markdown files.
- Re-running the script on an unchanged directory results in no database write operations.
- Modifying a single file and re-running the script results in updates only for that file's corresponding records in the database.
- Deleting a file from the source directory and re-running the script results in the removal of that file's data from the database.
- The `Resources` and `ResourceChunks` tables are created and populated correctly according to the schema.

## 8. Open Questions

- None at this time.
