import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import dotenv from 'dotenv';
dotenv.config();
const vectorStore = await MemoryVectorStore.fromTexts(
  ["Hello world", "Bye bye", "hello nice world"],
  [{ id: 2 }, { id: 1 }, { id: 3 }],
  new OpenAIEmbeddings()
);

const resultOne = await vectorStore.similaritySearch("hello world", 1);
console.log(resultOne);