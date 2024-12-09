"use server";

import { CoreMessage, CoreUserMessage, generateText } from "ai";
import { cookies } from "next/headers";

import { customModel } from "@/ai";

export async function saveModelId(model: string) {
	const cookieStore = await cookies();
	cookieStore.set("model-id", model);
}

export async function generateTitleFromUserMessage({
	message,
}: {
	message: CoreUserMessage;
}) {
	const { text: title } = await generateText({
		model: customModel("gpt-3.5-turbo"),
		system: `\n
    - ユーザーが会話を始めた最初のメッセージに基づいて短いタイトルを生成します
    - タイトルは80文字以内にしてください
    - タイトルはユーザーのメッセージの要約である必要があります
    - 引用符やコロンは使用しないでください`,
		prompt: JSON.stringify(message),
	});

	return title;
}
