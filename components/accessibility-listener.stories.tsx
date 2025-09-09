import type { Meta, StoryObj } from "@storybook/react";
import { AccessibilityListener } from "./accessibility-listener";
import { AccessibilityProvider } from "@/lib/accessibility/context";

const meta: Meta<typeof AccessibilityListener> = {
	title: "Components/Accessibility/AccessibilityListener",
	component: AccessibilityListener,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"Componente que gerencia funcionalidades de acessibilidade como navegação por teclado e anúncios de mudança de rota para leitores de tela.",
			},
		},
	},
	decorators: [
		(Story) => (
			<AccessibilityProvider>
				<Story />
			</AccessibilityProvider>
		),
	],
};

export default meta;
type Story = StoryObj<typeof AccessibilityListener>;

export const Default: Story = {
	args: {},
	parameters: {
		docs: {
			description: {
				story:
					"Estado padrão do componente AccessibilityListener. Este componente não renderiza visualmente mas gerencia funcionalidades de acessibilidade em background.",
			},
		},
	},
};

export const WithNavigation: Story = {
	args: {},
	parameters: {
		docs: {
			description: {
				story:
					"Demonstra o comportamento do componente durante navegação. Use Tab para navegar e observe os indicadores visuais de foco.",
			},
		},
	},
	render: () => (
		<div className="p-8 space-y-4">
			<AccessibilityListener />
			<button
				type="button"
				className="px-4 py-2 bg-blue-500 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
			>
				Botão 1
			</button>
			<button
				type="button"
				className="px-4 py-2 bg-green-500 text-white rounded focus:outline-none focus:ring-2 focus:ring-green-300"
			>
				Botão 2
			</button>
			<input
				type="text"
				placeholder="Campo de entrada"
				className="px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
			/>
		</div>
	),
};
