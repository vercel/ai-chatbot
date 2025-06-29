# PRD: URL Data Source for `llms.txt`

## 1. Introduction/Overview

This document outlines the requirements for implementing the `URLDataSource` to support reading and indexing markdown files from a remote `llms.txt` file. Currently, the `URLDataSource` is a stub and does not have any functionality. This feature will enable the chatbot to ingest knowledge from a curated list of URLs specified in a specific format.

The primary goal is to allow the system to fetch an `llms.txt` file from a given URL, parse it to extract markdown document links, download those documents, and make them available for indexing.

## 2. Goals

- Implement the `discoverDocuments` method in `indexer/data-sources/url.ts`.
- Enable the system to process a remote `llms.txt` file as a data source.
- Fetch and parse markdown files linked within the `llms.txt` file.
- Associate each indexed document with the section it came from in the `llms.txt` file.
- Ensure the implementation is robust with configurable parallel processing and error handling.

## 3. User Stories

- As a developer, I want to provide a URL to an `llms.txt` file so that the chatbot can index the markdown documents referenced in it.
- As a developer, I want to see which section from the `llms.txt` a document originated from to better understand its context.
- As a system administrator, I want to configure the concurrency and scraping delay to manage the load on remote servers.

## 4. Functional Requirements

1.  **Validation:**

    - The `validate` function in `URLDataSource` must be updated to check if the provided URL string ends with `/llms.txt`.

2.  **`llms.txt` Processing:**

    - The `discoverDocuments` method will fetch the content of the `llms.txt` file from the source URL.
    - It will use the `parseLLMsTxt` utility from `indexer/utils.ts` to parse the file content.

3.  **Document Fetching:**

    - The implementation will iterate through the parsed sections and links.
    - For each link, it will check if the URL points to a markdown file (i.e., ends with `.md` or `.mdx`).
    - It will download the content of each markdown file.
    - Non-markdown files will be skipped.

4.  **Document Yielding:**

    - For each successfully downloaded markdown document, `discoverDocuments` will yield an `IndexableDocument`.
    - The `IndexableDocument` interface in `indexer/types.ts` must be modified to include an optional `sectionName: string` property.
    - This `sectionName` property will be set to the name of the section from which the URL was parsed in the `llms.txt` file.

5.  **Concurrency and Delays:**

    - The implementation must support parallel downloading of markdown files.
    - This should be configurable via options passed to the `URLDataSource` constructor, with a default concurrency limit of 5.
    - The implementation must support an optional scraping delay between download requests.
    - This should be configurable, with a default delay of 250ms.

6.  **Error Handling:**
    - If downloading a markdown file from a URL fails (e.g., 404 Not Found), the error should be logged to the console, and the process should skip to the next file without halting the entire operation.

## 5. Non-Goals (Out of Scope)

- General-purpose web scraping from a root URL. The data source will only support the `llms.txt` format for this iteration.
- Crawling linked pages within the downloaded markdown documents.
- Support for any file types other than markdown (`.md`, `.mdx`).
- A sophisticated validation mechanism beyond checking the URL ending. Retrying failed downloads is not required.

## 6. Design Considerations

- The `IndexableDocument` interface in `indexer/types.ts` will be modified to include `sectionName?: string;`. This makes the change available to other parts of the system but is intended for this data source.

## 7. Technical Considerations

- The implementation should leverage the existing `parseLLMsTxt` function in `indexer/utils.ts`.
- Asynchronous operations should be managed effectively to handle parallel downloads (e.g., using `Promise.all` with a concurrency-limiting helper function).
- A helper function to introduce a delay (e.g., `await new Promise(resolve => setTimeout(resolve, delay))`) should be used if a scraping delay is configured.

## 8. Success Metrics

- The primary success metric is that given a valid URL to an `llms.txt` file, the system successfully fetches, parses, and yields `IndexableDocument` objects for all valid markdown URLs listed in the file. The `sectionName` for each document should be correctly populated.

## 9. Open Questions

- None at this time.
