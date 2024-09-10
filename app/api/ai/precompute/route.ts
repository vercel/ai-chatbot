/**
 * Handles the POST request for processing a lesson interaction between a user and an AI assistant.
 * The function extracts lesson-related parameters from the request body, retrieves message history
 * from MongoDB, constructs a system prompt, and processes the user's input to provide a response.
 *
 * @param {NextRequest} req - The incoming request object from Next.js containing the user's request data.
 * @returns {Promise<NextResponse>} - A NextResponse object containing the result of processing the user message.
 *
 * @async
 * @function POST
 *
 * @example
 * // Example usage of the POST function:
 * const response = await POST(req);
 *
 * @param {NextRequest} req - The HTTP request object from Next.js, which includes query parameters and request body.
 *
 * The request body must contain the following parameters:
 * @param {string} lesson_id - The unique identifier for the lesson.
 * @param {string} duration - The total duration of the lesson in minutes.
 * @param {string} topic - The topic of the lesson.
 * @param {string} session_sequence - The sequence of activities within the session.
 * @param {any} learning_results - The expected learning outcomes of the lesson.
 * @param {any} learning_experiences - A description of the user's learning experiences during the lesson.
 * @param {string} class_type - The type of the class (e.g., "Pronunciation", "Vocabulary", "Grammar").
 * @param {number} time_component - The amount of time spent so far in the lesson.
 * @param {string} user_message - The user’s message to the assistant.
 * @param {string} lesson_type - The type of the lesson (e.g., "free class", "guided class").
 *
 * The function performs the following steps:
 * 1. Extracts user and lesson data from the request.
 * 2. Connects to a MongoDB database using the provided connection string to retrieve chat history.
 * 3. Iterates over the retrieved messages and classifies them as either 'user' or 'assistant' messages.
 * 4. Limits the number of tokens (approx. 200) for processing the history to ensure efficient handling.
 * 5. Calls the `get_system_prompt` function to generate a system prompt based on the lesson's parameters.
 * 6. Uses the `process_script` function to process and clean the user's input.
 * 
 * The MongoDB collection used to store chat messages is identified by `chat_messages`, and session-specific
 * information is stored and retrieved using the sessionId.
 * 
 * The function logs key events, such as the connection string, newly processed messages, and system prompts, 
 * for debugging and monitoring purposes.
 */

import { NextRequest, NextResponse } from "next/server";
import get_system_prompt from "@/lib/api/get_system_prompt";
import { process_script } from "@/lib/api/process_script";
import { HumanMessage } from "@langchain/core/messages";
import { MongoDBChatMessageHistory } from "@langchain/mongodb";
import { MongoClient } from "mongodb";
import Groq from "groq-sdk";

const connection_string = process.env.MONGODB_CONNECTION_STRING || "";
console.log("Connection string", connection_string);
const client = new MongoClient(connection_string);
const groq_client = new Groq();

export async function POST(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get('uid');
  const body = await req.json();

  const {
    lesson_id,
    duration,
    topic,
    session_sequence,
    learning_results,
    learning_experiences,
    class_type,
    time_component,
    user_message,
    lesson_type,
  } = body as {
    lesson_id: string;
    duration: string;
    topic: string;
    session_sequence: string;
    learning_results: any;
    learning_experiences: any;
    class_type: string;
    time_component: number;
    user_message: string;
    lesson_type: string;
  }; // Time component is the time spent in the lesson as minutes

  const mongodb_history = new MongoDBChatMessageHistory({
    collection: client.db().collection("chat_messages"),
    sessionId: connection_string,
  });
  const messages = await mongodb_history.getMessages();
  let history = "";
  const newMessages: Array<{ role: string; content: string }> = [];

  for (const message of messages) {
    const num_tokens = history.length / 5;
    if (num_tokens > 200) break;

    if (message instanceof HumanMessage) {
      newMessages.push({ role: "user", content: message.content.toString() });
    } else {
      newMessages.push({
        role: "assistant",
        content: message.content.toString(),
      });
    }
  }
  console.log("New messages", newMessages);

  const system_prompt = await get_system_prompt(
    class_type,
    learning_experiences,
    learning_results,
    session_sequence,
    topic,
    duration,
    time_component,
    lesson_type
  );
  console.log("System prompt", system_prompt);

  const stream = await groq_client.chat.completions.create({
    messages: [
      {
        role: "system",
        content: system_prompt,
      },
      {
        role: "user",
        content:
          user_message !== ""
            ? user_message
            : `Start ${
                lesson_type === "free class" ? "chatting" : "lesson"
              } on topic: ${topic}`,
      },
    ],
    model: "llama3-70b-8192",
    temperature: 0.5,
    max_tokens: 945,
    top_p: 1,
    stop: "</s>",
    stream: true,
  });

  let generated_text = "";
  let new_text_counter = 0;
  const global_exercises: any[] = [];
  let complete_text = "";
  let pronanucaiotion_count = 0;

  for await (const new_text of stream) {
    if (new_text.choices[0].delta.content == null) continue;

    generated_text += new_text.choices[0].delta.content;
    generated_text = generated_text.replace(/\n/g, " ").replace("</s>", "");
    if (/[.!?]$/.test(generated_text.trim())) {
        generated_text = generated_text.replace(/\n/g, " ").replace("</s>", "");
    
    // Process <pronunciation> tags
    if (generated_text.includes("<pronunciation>")) {
      if (generated_text.includes("</pronunciation>")) {
        const pronunciation_pattern = /<pronunciation>(.*?)<\/pronunciation>/g;
        const tagged_text = pronunciation_pattern.exec(generated_text);
        if (tagged_text) {
          const tagged_text_content = tagged_text[0];
          generated_text = generated_text.replace(
            tagged_text_content,
            "<TAGGED_TEXT_PLACEHOLDER>"
          );

          const sentences = generated_text.split(/(?<!\d)[.!?](?!\d)\s+/);
          const pattern = /<TAGGED_TEXT_PLACEHOLDER>/g;

          for (let sentence of sentences) {
            sentence = sentence.replace(pattern, tagged_text_content).trim();

            if (sentence) {
              const { clean_script, exercises } = process_script(sentence) as any;
              if (exercises && global_exercises.length < 2) {
                for (const exercise of exercises) {
                  exercise.index = new_text_counter;
                  global_exercises.push(exercise);
                }
              }

              if (
                clean_script &&
                clean_script.length >= 8 &&
                pronanucaiotion_count < 1
              ) {
                complete_text += clean_script + "// ";
                pronanucaiotion_count++;
                generated_text = "";
                new_text_counter++;
              }
            }
          }
        }
      }

      // Process <fill> tags with answers
      const fillRegex = /<fill>([\s\S]*?)<\/fill>\[ANSWER: ([\s\S]*?)\]/g;
      const match = fillRegex.exec(generated_text);

      if (match) {{
          const tagged_text_content = match[0];
          const tagged_text_answer = match[1];
          generated_text = generated_text
            .replace(tagged_text_content, "FILL_TEXT_PLACEHOLDER")
            .replace(tagged_text_answer, "FILL_ANSWER_PLACEHOLDER");

          const sentences = generated_text.split(/(?<!\d)[.!?](?!\d)\s+/);
          sentences.forEach((sentence) => {
            sentence = sentence
              .replace("FILL_TEXT_PLACEHOLDER", tagged_text_content)
              .replace("FILL_ANSWER_PLACEHOLDER", tagged_text_answer)
              .trim();

            if (sentence) {
              const { cleanText: clean_script, exercises } = process_script(sentence) as { cleanText: string; exercises: Object[] };
              if (exercises) {
                exercises.forEach((exercise: any) => {
                  exercise.index = new_text_counter;
                  global_exercises.push(exercise);
                });
              }

              if (clean_script && clean_script.length >= 8) {
                complete_text += clean_script + " // ";
                generated_text = "";
                new_text_counter++;
              }
            }
          });
        }
      }
    } else {
        const sentenceRegex = /([^\d])[.!?](?!\d)\s+/g;
        const sentences = generated_text.split(sentenceRegex);
        console.log("Sentences", sentences);
        for (let sentence of sentences) {
            console.log("Sentence", sentence);
          sentence = sentence.trim();
          if (sentence.length > 3) {
            const { cleanText:clean_script } = process_script(sentence);
            if (!complete_text.includes(clean_script)) {
              complete_text += " //" + clean_script;
              generated_text = "";
              new_text_counter++;
            }
          }
        }
      }
    }
  }

  const ai_message = complete_text.slice(2); // Remove leading `//`
  console.log("AI message", ai_message);
  console.log("Global exercises", global_exercises);
  const ai_message_array = complete_text
  .split("//")                   // Split the text by the "//" separator
  .map(sentence => sentence.trim()) // Trim leading/trailing spaces for each sentence
  .filter(sentence => sentence.length > 0); // Filter out empty sentences

  if (ai_message_array.length > 0) {
    const history = new MongoDBChatMessageHistory({
        collection: client.db().collection("chat_messages"),
        sessionId: lesson_id,
    });
    history.addAIMessage(ai_message_array.join(" ").replace("/", ""));
    console.log("Added to history", ai_message_array.join(" ").replace("/", ""));

    return NextResponse.json({
        Output: ai_message_array,  // Return the array of sentences instead of concatenated string
        exercises: lesson_type !== "audio" ? global_exercises : [],
    });
} else {
    return NextResponse.json({ Output: "Error there is no message." });
}
}
