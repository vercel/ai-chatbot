import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArtifactCloseButton } from "./artifact-close-button";
import type { UIArtifact } from "./artifact";
import { SWRConfig } from "swr";

const meta: Meta<typeof ArtifactCloseButton> = {
	title: "Components/Artifact/ArtifactCloseButton",
	component: ArtifactCloseButton,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Botão para fechar/fechar artefato. Comportamento diferente baseado no status do artefato.",
			},
		},
	},
	decorators: [
		(Story) => (
			<SWRConfig value={{ provider: () => new Map() }}>
				<Story />
			</SWRConfig>
		),
	],
};

export default meta;
type Story = StoryObj<typeof ArtifactCloseButton>;

const mockArtifactIdle: UIArtifact = {
	documentId: "doc-123",
	content: "Conteúdo do documento",
	kind: "text",
	title: "Documento de Texto",
	status: "idle",
	isVisible: true,
	boundingBox: {
		top: 100,
		left: 200,
		width: 400,
		height: 300,
	},
};

const mockArtifactStreaming: UIArtifact = {
	...mockArtifactIdle,
	status: "streaming",
};

export const Default: Story = {
	parameters: {
		docs: {
			description: {
				story: "Estado padrão do botão de fechar artefato.",
			},
		},
		swr: {
			fallbackData: {
				artifact: mockArtifactIdle,
			},
		},
	},
};

export const StreamingArtifact: Story = {
	parameters: {
		docs: {
			description: {
				story:
					"Botão quando o artefato está em estado de streaming - apenas oculta o artefato sem resetar.",
			},
		},
		swr: {
			fallbackData: {
				artifact: mockArtifactStreaming,
			},
		},
	},
};

export const HiddenArtifact: Story = {
	parameters: {
		docs: {
			description: {
				story: "Botão quando o artefato está oculto.",
			},
		},
		swr: {
			fallbackData: {
				artifact: {
					...mockArtifactIdle,
					isVisible: false,
				},
			},
		},
	},
};
