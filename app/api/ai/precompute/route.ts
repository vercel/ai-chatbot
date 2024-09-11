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
    lesson_type,
    time_component,
    user_message = '',  // Default to empty string if user_message is undefined
    type,
    topics, // Add topics to handle free type
  } = body as {
    lesson_id: string;
    duration: string;
    topic: string;
    session_sequence: string;
    learning_results: any;
    learning_experiences: any;
    lesson_type: string;
    time_component: number;
    user_message: string;
    type: string;
    topics?: string[]; // Optional for free type lessons
  };

  // Conditional logging based on the type of lesson
  if (type === "free") {
    console.log("Free lesson type. Topics:", topics);
  } else {
    console.log("Parameters passed to get_system_prompt for structured lesson:", {
      lesson_type,
      learning_experiences,
      learning_results,
      session_sequence,
      topic,
      duration,
      time_component,
      type,
      topics,
    });
  }


  // Call get_system_prompt based on the lesson type
  let system_prompt;
  if (type === "free") {
    if (!topics || topics.length === 0) {
      return NextResponse.json({
        error: "Topics are required for free lessons.",
      }, { status: 400 });
    }
  
    // Call get_system_prompt with only type and topics for free lessons
    system_prompt = get_system_prompt(
      null,        // No lesson_type for free lessons
      null,        // No learning_experiences for free lessons
      null,        // No learning_results for free lessons
      null,        // No session_sequence for free lessons
      null,        // No single topic for free lessons
      topics,      // Pass topics array
      null,        // No duration for free lessons
      null,        // No time_component for free lessons
      type         // Free lesson type
    );
  } else {
    // Call get_system_prompt for structured lessons with all the necessary fields
    system_prompt = get_system_prompt(
      lesson_type,          // Structured lesson type
      learning_experiences, // Learning experiences
      learning_results,     // Learning results
      session_sequence,     // Session sequence
      topic,                // Single topic
      null,                 // No topics array for structured lessons
      duration,             // Duration for structured lessons
      time_component,       // Time component for structured lessons
      type                  // Structured lesson type
    );
  }
    
  console.log("Generated system prompt:", system_prompt);
  
  if (!system_prompt) {
    console.error("Error: System prompt is empty or undefined");
    return NextResponse.json({
      error: "System prompt is required but missing.",
    }, { status: 400 });
  }

  // Fetch chat history from MongoDB
  const mongodb_history = new MongoDBChatMessageHistory({
    collection: client.db().collection("beluga-test"),
    sessionId: connection_string,
  });
  const messages = await mongodb_history.getMessages();
  console.log("Messages fetched from MongoDB:", messages);
  
  // Prepare messages for the chat model
  let newMessages: Array<{ role: string; content: string }> = [];
  for (const message of messages) {
    if (message instanceof HumanMessage) {
      newMessages.push({ role: "user", content: message.content.toString() });
    } else {
      newMessages.push({ role: "assistant", content: message.content.toString() });
    }
  }
  console.log("New messages prepared for Groq:", newMessages);

  // Create the Groq API stream request
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
            : `Start ${type === "free class" ? "chatting" : "lesson"} on topic: ${topic}`,
      },
    ],
    model: "llama3-70b-8192",
    temperature: 0.5,
    max_tokens: 945,
    top_p: 1,
    stop: "</s>",
    stream: true,
  });

  // Processing the response from Groq
  let generated_text = "";
  let new_text_counter = 0;
  const global_exercises: any[] = [];
  let complete_text = "";
  let pronunciation_count = 0;

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
                pronunciation_count < 1
              ) {
                complete_text += clean_script + "// ";
                pronunciation_count++;
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
  console.log("AI message generated:", ai_message);
  console.log("Global exercises generated:", global_exercises);

  // Prepare final response
  const ai_message_array = complete_text
    .split("//")
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 0);

  if (ai_message_array.length > 0) {
    const history = new MongoDBChatMessageHistory({
      collection: client.db().collection("chat_messages"),
      sessionId: lesson_id,
    });
    history.addAIMessage(ai_message_array.join(" ").replace("/", ""));
    console.log("Added to history:", ai_message_array.join(" ").replace("/", ""));

    return NextResponse.json({
      Output: ai_message_array,
      exercises: type !== "audio" ? global_exercises : [],
    });
  } else {
    return NextResponse.json({ Output: "Error there is no message." });
  }
}
