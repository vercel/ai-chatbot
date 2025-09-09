import type { Meta, StoryObj } from "@storybook/react";
import { ChatHeader } from "./chat-header";
import { SidebarProvider } from "./ui/sidebar";
import { TooltipProvider } from "./ui/tooltip";
import type { Session } from "next-auth";
import type { VisibilityType } from "./visibility-selector";

const meta: Meta<typeof ChatHeader> = {
	title: "Components/Chat/ChatHeader",
	component: ChatHeader,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"Cabeçalho do chat com controles de navegação, visibilidade e deploy.",
			},
		},
	},
	decorators: [
		(Story) => (
			<TooltipProvider>
				<SidebarProvider>
					<Story />
				</SidebarProvider>
			</TooltipProvider>
		),
	],
};

export default meta;
type Story = StoryObj<typeof ChatHeader>;

const mockSession: Session = {
	user: {
		id: "1",
		name: "John Doe",
		email: "john@example.com",
		image: null,
		type: "regular" as const,
	},
	expires: "2024-12-31",
};

export const Default: Story = {
	args: {
		chatId: "chat-123",
		selectedVisibilityType: "private" as VisibilityType,
		isReadonly: false,
		session: mockSession,
	},
	parameters: {
		docs: {
			description: {
				story:
					"Estado padrão do cabeçalho do chat com chat privado e editável.",
			},
		},
	},
};

export const PublicChat: Story = {
	args: {
		chatId: "chat-456",
		selectedVisibilityType: "public" as VisibilityType,
		isReadonly: false,
		session: mockSession,
	},
	parameters: {
		docs: {
			description: {
				story: "Cabeçalho com chat público visível para todos.",
			},
		},
	},
};

export const ReadonlyChat: Story = {
	args: {
		chatId: "chat-789",
		selectedVisibilityType: "private" as VisibilityType,
		isReadonly: true,
		session: mockSession,
	},
	parameters: {
		docs: {
			description: {
				story: "Cabeçalho de chat somente leitura sem seletor de visibilidade.",
			},
		},
	},
};

export const WithoutSession: Story = {
	args: {
		chatId: "chat-999",
		selectedVisibilityType: "private" as VisibilityType,
		isReadonly: false,
		session: null as unknown as Session,
	},
	parameters: {
		docs: {
			description: {
				story: "Cabeçalho sem sessão de usuário autenticado.",
			},
		},
	},
};
