import { kv } from '@vercel/kv'
import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage, OpenAIStream, StreamingTextResponse } from "ai";
import type { ToolInterface } from "@langchain/core/tools";
import { DynamicStructuredTool, RequestsGetTool, RequestsPostTool } from "langchain/tools";
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { ChatOpenAI } from "@langchain/openai";
import { AIMessage, ChatMessage, HumanMessage } from "@langchain/core/messages";
import OpenAI from 'openai'
import { z } from "zod";

import { auth } from '@/auth'
import { nanoid } from '@/lib/utils'

export const runtime = 'edge'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const convertVercelMessageToLangChainMessage = (message: VercelChatMessage) => {
  if (message.role === "user") {
    return new HumanMessage(message.content);
  } else if (message.role === "assistant") {
    return new AIMessage(message.content);
  } else {
    return new ChatMessage(message.content, message.role);
  }
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = (await auth())?.user.id
    const { previewToken } = body

    if (!userId) {
      return new Response('Unauthorized', {
        status: 401
      })
    }

    if (previewToken) {
      openai.apiKey = previewToken
    }


    const messages = (body.messages ?? []).filter(
      (message: VercelChatMessage) =>
        message.role === "user" || message.role === "assistant",
    );
    const returnIntermediateSteps = body.show_intermediate_steps ?? false;
    const previousMessages = messages
      .slice(0, -1)
      .map(convertVercelMessageToLangChainMessage);
    const currentMessageContent = messages[messages.length - 1].content;

    const fetchCryptoPrice = new DynamicStructuredTool({
      name: "fetchCryptoPrice",
      description: "Fetches the current price of a specified cryptocurrency",
      schema: z.object({
        cryptoName: z.string(),
        vsCurrency: z.string().optional().default("USD"),
      }),
      func: async (options) => {
        console.log(
          "Triggered fetchCryptoPrice function with options: ",
          options,
        );
        const { cryptoName, vsCurrency } = options;
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoName}&vs_currencies=${vsCurrency}`;
        const response = await fetch(url);
        const data = await response.json();
        // Ensure the cryptoName and vsCurrency are correctly accessed.
        const price = data[cryptoName.toLowerCase()]?.[vsCurrency.toLowerCase()];
        if (price === undefined) {
          console.error("Price not found in response:", data);
          return "Price not available";
        }
        return price.toString();
      },
    });

    //https://api.birdprotocol.com/analytics/address/sol/{address}

    const fetchWalletDetails = new DynamicStructuredTool({
      name: "fetchWalletDetails",
      description: "Fetches the the details about a spcific Solana Wallet Address",
      schema: z.object({
        address: z.any(),
        // vsCurrency: z.string().optional().default("USD"),
      }),
      func: async (options) => {
        console.log(
          "Triggered fetchWalletDetails function with options: ",
          options,
        );
        // const  { name }  = options;
        const url = `https://api.birdprotocol.com/analytics/address/${options.address}`;
        console.log(`THIS IS THE BIRD ENGINE URL ${url}`)
        const response = await fetch(url);
        // console.log(`this is the reponse ${JSON.stringify(await response.json(), null, 2)}`)
        const data = JSON.stringify(await response.json(), null, 2);
        console.log(`This is the stringified response: ${JSON.stringify(data, null, 2)}`);
        return data;
      },
    });

    //
    const tools = [
      new RequestsGetTool(),
      new RequestsPostTool(),
      fetchWalletDetails,
      fetchCryptoPrice,
      
    ] as ToolInterface[];

    const model = new ChatOpenAI({
      temperature: 0,
      streaming: true,
      modelName: "gpt-3.5-turbo-0125",
    });

    const agentExecutor = await initializeAgentExecutorWithOptions(
      tools,
      model,
      {
        agentType: "openai-functions",
        returnIntermediateSteps,
      },
    );

    if (!returnIntermediateSteps) {
      const result = await agentExecutor.invoke({
        input: currentMessageContent,
        chat_history: previousMessages,
      });

      const title = body.messages[0].content.substring(0, 100)
      const id = body.id ?? nanoid()
      const createdAt = Date.now()
      const path = `/chat/${id}`
      const payload = {
        id,
        title,
        userId,
        createdAt,
        path,
        messages: [
          ...messages,
          {
            content: result.output,
            role: 'assistant'
          }
        ]
      }
      await kv.hmset(`chat:${id}`, payload)
      await kv.zadd(`user:chat:${userId}`, {
        score: createdAt,
        member: `chat:${id}`
      })

      const logStream = await agentExecutor.streamLog({
        input: currentMessageContent,
        chat_history: previousMessages,
      });

      const textEncoder = new TextEncoder();
      const transformStream = new ReadableStream({
        async start(controller) {
          for await (const chunk of logStream) {
            if (chunk.ops?.length > 0 && chunk.ops[0].op === "add") {
              const addOp = chunk.ops[0];
              if (
                addOp.path.startsWith("/logs/ChatOpenAI") &&
                typeof addOp.value === "string" &&
                addOp.value.length
              ) {
                controller.enqueue(textEncoder.encode(addOp.value));
              }
            }
          }
          controller.close();
        },
      });

      return new StreamingTextResponse(transformStream);
    } 
    else {
      const result = await agentExecutor.invoke({
        input: currentMessageContent,
        chat_history: previousMessages,
      });

      return NextResponse.json(
        { output: result.output, intermediate_steps: result.intermediateSteps },
        { status: 200 },
      );
    }

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}