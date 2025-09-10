import { AutoViewAgent } from "@autoview/agent";
import typia, { type tags } from "typia";

// Define the Chat interface with typia tags
export interface IChat {
	id: string & tags.Format<"uuid">;
	createdAt: string & tags.Format<"date-time">;
	title: string;
	userId: string & tags.Format<"uuid">;
	visibility: "public" | "private";
}

// Create AutoView agent for Chat
export const chatAutoViewAgent = new AutoViewAgent({
	model: "chatgpt",
	vendor: {
		api: {
			apiKey: process.env.OPENAI_API_KEY || "********",
		},
		model: "o3-mini",
		isThinkingEnabled: true,
	},
	input: {
		type: "json-schema",
		schema: typia.json.schema<IChat>(),
	},
	transformFunctionName: "transformChat",
	experimentalAllInOne: true,
});
