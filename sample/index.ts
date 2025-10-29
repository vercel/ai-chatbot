/* eslint-disable @typescript-eslint/no-explicit-any */
import { OpenAI } from "openai";
import { ChatCompletionCreateParamsBase } from "openai/resources/chat/completions";

if (!process.env.HF_TOKEN) {
    throw new Error("HF_TOKEN is not set in environment variables");
}

export const huggingfaceClient = new OpenAI({
    baseURL: "https://router.huggingface.co/v1",
    apiKey: process.env.HF_TOKEN,
});

export interface HuggingFaceConfig {
    model: string;
    messages: any[];
    stream?: boolean;
}

export async function createCompletion(config: HuggingFaceConfig) {
    try {
        const stream = await huggingfaceClient.chat.completions.create({
            model: config.model,
            messages: config.messages,
            stream: config.stream,
        } as ChatCompletionCreateParamsBase);

        return stream;
    } catch (error) {
        console.error("Error in Hugging Face completion:", error);
        throw error;
    }
}
