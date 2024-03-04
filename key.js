import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import { CSVLoader } from "langchain/document_loaders/fs/csv";
import fs from 'fs';
import csv from 'csv';
import "dotenv/config";

const address_loader = new CSVLoader('./upload/test.csv', "address");
const address = await address_loader.load();

const content_loader = new CSVLoader('./upload/test.csv', "content");
const content = await content_loader.load();
// Specify the relative path to the local ChromaDB server
const vectorStore = await MemoryVectorStore.fromDocuments(
  address,
  new OpenAIEmbeddings(process.env.OPENAI_API_KEY)
  );
  
  const userQuery = "tell me about address is FsJ3A3u2vn5cTVofAjvy6y5kwABJAqYWpe4975bi2epH"
  
  const resultOne = await vectorStore.similaritySearch(userQuery, 1);
  
  console.log(resultOne);
  const num = resultOne[0].metadata.line
  console.log(content[num-1].pageContent, "-----=-=-=");

const inputFilePath = './upload/test.csv';
let vectorStore_search = null;

export async function createVectorStore() {
  return new Promise((resolve, reject) => {
    const addresses = [];
    const contents = [];

    fs.createReadStream(inputFilePath)
      .pipe(csv(['address', 'content']))
      .on('data', (data) => {
        addresses.push(data.address);
        contents.push(data.content);
      })
      .on('end', async () => {  
        const openai = new OpenAIEmbeddings(process.env.OPENAI_API_KEY);
        const vectorStore = await MemoryVectorStore.fromTexts(addresses, contents, openai);

        vectorStore_search = vectorStore;
        resolve(vectorStore);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

export async function performSearch(query) {
  if (!vectorStore_search) {
    await createVectorStore();
  }

  const searchResults = await vectorStore_search.similaritySearch(query, 1);
  console.log(searchResults[0].metadata);
}

(async () => {

  // Now you can perform multiple searches using the vectorStore_search variable
  await performSearch("tell me information about address is 5ocnV1qiCgaQR8Jb8xWnVbApfaygJ8tNoZfgPwsgx9kx");
})();



