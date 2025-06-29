Use @create-prd.mdc.

I want to add the ability to index (for a RAG chatbot) all markdown (.md) or MDX files (.mdx) recursively from a starting directory. However, I also want to support indexing by scraping a URL, or from a Github repo, in future so ensure appropriate interfaces or abstractions are implemented. The result should be a node script that I can run with params.

The embeddings will be stored in Postgres using the pgvector extension. Use the existing Drizzle DB configuration in this repo and add new schema / migrations files as appropriate.

Important: I should be able to run the script repeatedly, and the embeddings should only be recalculated and updated in the DB if the file has changed since previous indexing. So I assume some sort of hashing is required, or else use whatever solution is most appropriate.

Also ensure that I can easily remove a previously indexed document and clean up it's related embeddings.

Use the Vercel "ai" package (already in repo) and related libs for all AI-related code.

Ensure markdown files are chunked using an appropriate text splitter.

Use OpenAI's `text-embedding-ada-002` for embedding model.

Do not update anything in the chatbot that's part of this repo. Using the Vectors will be handled separately.

The script for this feature should be generated in a new `/indexer` folder.
