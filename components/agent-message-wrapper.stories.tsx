import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AgentMessageWrapper } from "./agent-message-wrapper";
import type { ChatMessage } from "@/lib/types";
import type { Vote } from "@/lib/db/schema";
import type { UseChatHelpers } from "@ai-sdk/react";

const meta: Meta<typeof AgentMessageWrapper> = {
	title: "Components/Agent/AgentMessageWrapper",
	component: AgentMessageWrapper,
	parameters: {
		layout: "padded",
		docs: {
			description: {
				component:
					"Wrapper inteligente que detecta mensagens de co-agentes e as renderiza com formatação especial baseada na fase da jornada solar.",
			},
		},
	},
};

export default meta;
type Story = StoryObj<typeof AgentMessageWrapper>;

const mockVote: Vote = {
	chatId: "chat-123",
	messageId: "msg-456",
	isUpvoted: true,
};

const mockSetMessages: UseChatHelpers<ChatMessage>["setMessages"] = () => {};
const mockRegenerate: UseChatHelpers<ChatMessage>["regenerate"] =
	async () => {};

const baseMessage: ChatMessage = {
	id: "msg-456",
	role: "assistant",
	parts: [],
};

export const InvestigationPhase: Story = {
	args: {
		chatId: "chat-123",
		message: {
			...baseMessage,
			parts: [
				{
					type: "text",
					text: "Como agente especialista em investigação, vou analisar a conta de luz fornecida e validar os dados do cliente. O endereço informado é válido e o consumo médio está dentro dos padrões esperados para uma residência.",
				},
			],
		},
		vote: mockVote,
		isLoading: false,
		setMessages: mockSetMessages,
		regenerate: mockRegenerate,
		isReadonly: false,
		requiresScrollPadding: false,
		isArtifactVisible: false,
	},
	parameters: {
		docs: {
			description: {
				story:
					"Mensagem detectada como fase de investigação - mostra análise de conta de luz e validação de dados.",
			},
		},
	},
};

export const DetectionPhase: Story = {
	args: {
		chatId: "chat-123",
		message: {
			...baseMessage,
			parts: [
				{
					type: "text",
					text: "O agente de detecção identificou 24 painéis solares no telhado com orientação adequada. A análise visual mostra boa condição dos painéis existentes e potencial para expansão.",
				},
			],
		},
		vote: mockVote,
		isLoading: false,
		setMessages: mockSetMessages,
		regenerate: mockRegenerate,
		isReadonly: false,
		requiresScrollPadding: false,
		isArtifactVisible: false,
	},
	parameters: {
		docs: {
			description: {
				story:
					"Mensagem detectada como fase de detecção - mostra análise de telhado e identificação de painéis.",
			},
		},
	},
};

export const AnalysisPhase: Story = {
	args: {
		chatId: "chat-123",
		message: {
			...baseMessage,
			parts: [
				{
					type: "text",
					text: "Na fase de análise, avaliei o consumo elétrico e a viabilidade técnica. O ROI projetado é de 18% ao ano com payback em 6.2 anos. Os custos de instalação estão estimados em R$ 45.000.",
				},
			],
		},
		vote: mockVote,
		isLoading: false,
		setMessages: mockSetMessages,
		regenerate: mockRegenerate,
		isReadonly: false,
		requiresScrollPadding: false,
		isArtifactVisible: false,
	},
	parameters: {
		docs: {
			description: {
				story:
					"Mensagem detectada como fase de análise - mostra avaliação financeira e viabilidade técnica.",
			},
		},
	},
};

export const SizingPhase: Story = {
	args: {
		chatId: "chat-123",
		message: {
			...baseMessage,
			parts: [
				{
					type: "text",
					text: "Para o dimensionamento do sistema, recomendo uma configuração de 8kWp com 20 painéis de 400W cada. O layout otimizado maximiza a produção considerando a orientação e inclinação do telhado.",
				},
			],
		},
		vote: mockVote,
		isLoading: false,
		setMessages: mockSetMessages,
		regenerate: mockRegenerate,
		isReadonly: false,
		requiresScrollPadding: false,
		isArtifactVisible: false,
	},
	parameters: {
		docs: {
			description: {
				story:
					"Mensagem detectada como fase de dimensionamento - mostra configuração técnica e layout do sistema.",
			},
		},
	},
};

export const RecommendationPhase: Story = {
	args: {
		chatId: "chat-123",
		message: {
			...baseMessage,
			parts: [
				{
					type: "text",
					text: "Como recomendação final, proponho um sistema completo com garantia de 25 anos nos painéis e 10 anos no inversor. A solução inclui monitoramento remoto e manutenção preventiva por 5 anos.",
				},
			],
		},
		vote: mockVote,
		isLoading: false,
		setMessages: mockSetMessages,
		regenerate: mockRegenerate,
		isReadonly: false,
		requiresScrollPadding: false,
		isArtifactVisible: false,
	},
	parameters: {
		docs: {
			description: {
				story:
					"Mensagem detectada como fase de recomendação - mostra proposta final e garantias.",
			},
		},
	},
};

export const RegularMessage: Story = {
	args: {
		chatId: "chat-123",
		message: {
			...baseMessage,
			parts: [
				{
					type: "text",
					text: "Olá! Como posso ajudar você hoje com seu projeto de energia solar?",
				},
			],
		},
		vote: mockVote,
		isLoading: false,
		setMessages: mockSetMessages,
		regenerate: mockRegenerate,
		isReadonly: false,
		requiresScrollPadding: false,
		isArtifactVisible: false,
	},
	parameters: {
		docs: {
			description: {
				story:
					"Mensagem normal que não é detectada como de co-agente - renderiza como mensagem padrão.",
			},
		},
	},
};

export const LoadingState: Story = {
	args: {
		chatId: "chat-123",
		message: {
			...baseMessage,
			parts: [
				{
					type: "text",
					text: "Analisando os dados fornecidos...",
				},
			],
		},
		vote: mockVote,
		isLoading: true,
		setMessages: mockSetMessages,
		regenerate: mockRegenerate,
		isReadonly: false,
		requiresScrollPadding: false,
		isArtifactVisible: false,
	},
	parameters: {
		docs: {
			description: {
				story:
					"Estado de carregamento mostrando indicador visual durante processamento.",
			},
		},
	},
};
