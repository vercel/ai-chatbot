import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArtifactMessages } from "./artifact-messages";
import type { ChatMessage } from "@/lib/types";
import type { Vote } from "@/lib/db/schema";
import type { UseChatHelpers } from "@ai-sdk/react";

const meta: Meta<typeof ArtifactMessages> = {
	title: "Components/Artifact/ArtifactMessages",
	component: ArtifactMessages,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"Container otimizado para exibir mensagens em contexto de artefato com scroll virtual e indicadores de loading.",
			},
		},
	},
};

export default meta;
type Story = StoryObj<typeof ArtifactMessages>;

const mockMessages: ChatMessage[] = [
	{
		id: "msg-1",
		role: "user",
		parts: [
			{
				type: "text",
				text: "Olá! Preciso de ajuda para analisar minha conta de luz para um sistema solar.",
			},
		],
	},
	{
		id: "msg-2",
		role: "assistant",
		parts: [
			{
				type: "text",
				text: "Olá! Claro, posso ajudar você a analisar sua conta de luz. Por favor, faça o upload da conta para que eu possa analisar o consumo e sugerir um sistema solar adequado.",
			},
		],
	},
	{
		id: "msg-3",
		role: "user",
		parts: [
			{
				type: "text",
				text: "Aqui está minha conta de luz dos últimos 12 meses.",
			},
		],
	},
];

const mockVotes: Vote[] = [
	{
		chatId: "chat-123",
		messageId: "msg-2",
		isUpvoted: true,
	},
];

const mockSetMessages: UseChatHelpers<ChatMessage>["setMessages"] = () => {};
const mockRegenerate: UseChatHelpers<ChatMessage>["regenerate"] =
	async () => {};

export const Default: Story = {
	args: {
		chatId: "chat-123",
		status: "ready",
		votes: mockVotes,
		messages: mockMessages,
		setMessages: mockSetMessages,
		regenerate: mockRegenerate,
		isReadonly: false,
		artifactStatus: "idle",
	},
	parameters: {
		docs: {
			description: {
				story: "Estado padrão com mensagens de conversa normal.",
			},
		},
	},
};

export const Streaming: Story = {
	args: {
		...Default.args,
		status: "streaming",
		artifactStatus: "streaming",
	},
	parameters: {
		docs: {
			description: {
				story:
					"Estado de streaming mostrando indicador de loading na última mensagem.",
			},
		},
	},
};

export const WithThinkingMessage: Story = {
	args: {
		...Default.args,
		status: "submitted",
		messages: mockMessages.slice(0, 2), // Remove a última mensagem do usuário
	},
	parameters: {
		docs: {
			description: {
				story:
					"Estado submitted mostrando mensagem de 'pensando' quando aguardando resposta.",
			},
		},
	},
};

export const ReadOnly: Story = {
	args: {
		...Default.args,
		isReadonly: true,
	},
	parameters: {
		docs: {
			description: {
				story: "Modo somente leitura desabilitando interações do usuário.",
			},
		},
	},
};

export const Empty: Story = {
	args: {
		...Default.args,
		messages: [],
	},
	parameters: {
		docs: {
			description: {
				story: "Estado vazio sem mensagens para exibir.",
			},
		},
	},
};

export const WithMultipleVotes: Story = {
	args: {
		...Default.args,
		votes: [
			...mockVotes,
			{
				chatId: "chat-123",
				messageId: "msg-1",
				isUpvoted: false,
			},
		],
	},
	parameters: {
		docs: {
			description: {
				story: "Várias mensagens com votos positivos e negativos.",
			},
		},
	},
};
