import * as dotenv from "dotenv";
import { OpenAI } from 'openai';
import { Assistant } from "openai/resources/beta/assistants";
import { Uploadable } from "openai/uploads";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface AssistantParams {
  name: string;
  instructions: string;
}

 export const createAssistant = async ({ name, instructions }: AssistantParams): Promise<string> => {
  const assistant = await openai.beta.assistants.create({
    name: name,
    instructions: instructions,
    tools: [{ type: "code_interpreter" }],
    model: "gpt-3.5-turbo",
  });

  console.log("Assistant created:", assistant);
  return JSON.stringify(assistant);
};

export const runAssistant = async ({ assistantId, threadId, instructions }:{assistantId:string,threadId:string,instructions:string}):Promise<string> => {
  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: assistantId,
    instructions: instructions,
  });
  console.log(`runAssistant: ${run.id}`)
  return JSON.stringify(run);
};

export const getAllAssitants = async () => {
  const myAssistants = await openai.beta.assistants.list({
    order: "desc",
  });

  return myAssistants;
};

export const getAssistant = async (assistantId:string) => {
  const assistant = await openai.beta.assistants.retrieve(assistantId);
  return assistant;
};

//delete assistant
export const deleteAssistant = async (assistantId:string) => {
  const response = await openai.beta.assistants.del(assistantId);
  return response;
};

//check on the run thread
export const runCheck = async ({ threadId, runId }: { threadId: string, runId: string }) => {
  console.log(`Inside runCheck, threadId: ${threadId}, runId: ${runId}`);
  const check = await openai.beta.threads.runs.retrieve(threadId, runId);

  console.log(`Check metadata: ${JSON.stringify(check.metadata)}`);
  console.log(`Check error: ${JSON.stringify(check.last_error)}`);
  console.log(`Check traceback: ${JSON.stringify(check.temperature)}`);
  
  return check;
};

/* const getAllThreads = async () =>{

  const threadList = await openai.beta.threads.
} */

//create new thrad and also run it up make it work
// const createAndRunThread = async (threadid:string) => {
//   const newThread = await openai.beta.threads.createAndRun();
//   return newThread;
// };

//create thread
export const createThread = async () :Promise<string>=> {
  const thread = await openai.beta.threads.create();
  return JSON.stringify(thread);
};

//get thread
export const getThread = async (threadId:string) => {
  const thread = await openai.beta.threads.retrieve(threadId);
  return thread;
};

//delete thread
export const deleteThread = async (threadId:string) => {
  const response = await openai.beta.threads.del(threadId);
  return response;
};

//create message
export const createMessage = async ({ threadId, content }:{threadId:string,content:string}):Promise<string> => {
  const messages = await openai.beta.threads.messages.create(threadId, {
    role: "user",
    content: content,
  });
  return JSON.stringify(messages);
};

//get messages
export const getMessages = async ({threadId}:{threadId:string}) => {
  const messages = await openai.beta.threads.messages.list(threadId, {
    order: "asc",
    limit: 100,
  });
  return messages;
};

// Upload a file with an "assistants" purpose

export const UploadFile = async (fileSrc:Uploadable) => {
  const file = await openai.files.create({
    file: fileSrc,
    purpose: "assistants",
  });
  return file;
};


