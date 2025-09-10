import { AutoViewAgent } from "@autoview/agent";
import typia, { type tags } from "typia";
import OpenAI from "openai";

// Define the User interface with typia tags for better generation
export interface IUser {
	id: string & tags.Format<"uuid">;
	email: string & tags.Format<"email">;
	password?: string & tags.Format<"password">;
}

// Create AutoView agent for User
export const userAutoViewAgent = new AutoViewAgent({
	model: "chatgpt",
	vendor: {
		api: new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "********" }),
		model: "o3-mini",
		isThinkingEnabled: true,
	},
	input: {
		type: "json-schema",
		schema: typia.json.schema<IUser>(),
	},
	transformFunctionName: "transformUser",
	experimentalAllInOne: true,
});
