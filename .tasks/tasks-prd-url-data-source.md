## Relevant Files

- `indexer/data-sources/url.ts` - Main file for implementing the `URLDataSource` logic.
- `indexer/data-sources/url.test.ts` - Unit tests for `URLDataSource`.
- `indexer/types.ts` - Contains the `IndexableDocument` type definition that needs to be modified.
- `indexer/utils.ts` - Contains the `parseLLMsTxt` utility function to be used.

### Notes

- Unit tests should be placed alongside the code files they are testing (e.g., `url.ts` and `url.test.ts` in the same directory).
- Use `pnpm test [optional/path/to/test/file]` to run tests. Running without a path executes all tests.

## Tasks

- [ ] 1.0 Update `IndexableDocument` type
  - [ ] 1.1 Open `indexer/types.ts`.
  - [ ] 1.2 Add an optional `sectionName: string;` property to the `IndexableDocument` interface.
- [ ] 2.0 Implement `URLDataSource` Validation and Configuration
  - [ ] 2.1 Open `indexer/data-sources/url.ts`.
  - [ ] 2.2 Update the `validate` function to check if the source URL string ends with `/llms.txt`.
  - [ ] 2.3 Add a constructor to `URLDataSource` to accept options for `concurrency` (default: 5) and `delay` (default: 250ms).
  - [ ] 2.4 Store these options in private class members.
- [ ] 3.0 Fetch and Parse `llms.txt` in `discoverDocuments`
  - [ ] 3.1 In the `discoverDocuments` method, fetch the content from the source URL.
  - [ ] 3.2 Call `parseLLMsTxt` from `indexer/utils.ts` to parse the fetched content.
- [ ] 4.0 Implement Concurrent Markdown File Downloading
  - [ ] 4.1 Iterate through the parsed sections and links from the `llms.txt` file.
  - [ ] 4.2 Filter for links that end with `.md` or `.mdx`, skipping others.
  - [ ] 4.3 Implement a concurrency-limiting mechanism to download markdown files in parallel based on the `concurrency` setting.
  - [ ] 4.4 Use the configured `delay` between download requests.
- [ ] 5.0 Yield `IndexableDocument` with Error Handling
  - [ ] 5.1 For each successfully downloaded markdown file, `yield` an `IndexableDocument`.
  - [ ] 5.2 Populate the `IndexableDocument` with `sourceId`, `uri`, `content`, and the `sectionName` from the parsed `llms.txt`.
  - [ ] 5.3 If a download for an individual markdown file fails, log the error and continue to the next file.
- [ ] 6.0 Write Unit Tests for `URLDataSource`
  - [ ] 6.1 Create a new test file `indexer/data-sources/url.test.ts`.
  - [ ] 6.2 Mock `fetch` to simulate fetching `llms.txt` and markdown files.
  - [ ] 6.3 Test the `validate` function with valid and invalid URLs.
  - [ ] 6.4 Test that `discoverDocuments` yields correctly structured `IndexableDocument` objects, including the `sectionName`.
  - [ ] 6.5 Test the error handling for failed markdown file downloads.
