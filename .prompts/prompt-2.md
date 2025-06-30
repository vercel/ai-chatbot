Use @create-prd.mdc to help me create a PRD.

I want to implement the existing @url.ts data source to support reading markdown files from a URL. However for now it will only support URLs pointing to an `llms.txt` file, so ensure that in the `validate` fn (In future, it might be possible to scrape any website from root URL for example)

The implementation will download the `llms.txt` file from the given URL and use the `parseLLMsTxt` fn in the @utils.ts file to parse the content to get a list of all the URLs. Read the JS doc for that fn to understand the return shape. The implementation will only support downloading markdown files. Skip any other file type.

The `discoverDocuments` implementation should yield a `IndexableDocument` as usual, but extend that interface to allow for an optional `sectionName` property and set that according to the section each URL is within, in the llms.txt file.

The implementation should support parallel processing (up to some concurrency limit), and should also support an optional scraping delay, to avoid overloading the server.
