import type { Meta, StoryObj } from "@storybook/react";
import { ArtifactActions } from "./artifact-actions";
import { TooltipProvider } from "./ui/tooltip";
import type { UIArtifact } from "./artifact";

const meta: Meta<typeof ArtifactActions> = {
	title: "Components/Artifact/ArtifactActions",
	component: ArtifactActions,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Botões de ação para artefatos com funcionalidades como salvar, copiar, baixar, etc.",
			},
		},
	},
	decorators: [
		(Story) => (
			<TooltipProvider>
				<Story />
			</TooltipProvider>
		),
	],
};

export default meta;
type Story = StoryObj<typeof ArtifactActions>;

const mockArtifact: UIArtifact = {
	title: "Sample Artifact",
	documentId: "doc-123",
	kind: "text",
	content: "Sample content",
	isVisible: true,
	status: "idle",
	boundingBox: {
		top: 100,
		left: 200,
		width: 400,
		height: 300,
	},
};

const mockHandleVersionChange = (
	type: "next" | "prev" | "toggle" | "latest",
) => {
	console.log("Version change:", type);
};

export const Default: Story = {
	args: {
		artifact: mockArtifact,
		handleVersionChange: mockHandleVersionChange,
		currentVersionIndex: 0,
		isCurrentVersion: true,
		mode: "edit",
		metadata: {},
		setMetadata: () => {},
	},
	parameters: {
		docs: {
			description: {
				story: "Estado padrão das ações do artefato em modo de edição.",
			},
		},
	},
};

export const DiffMode: Story = {
	args: {
		artifact: { ...mockArtifact, status: "idle" },
		handleVersionChange: mockHandleVersionChange,
		currentVersionIndex: 1,
		isCurrentVersion: false,
		mode: "diff",
		metadata: {},
		setMetadata: () => {},
	},
	parameters: {
		docs: {
			description: {
				story: "Ações do artefato em modo de comparação de diferenças.",
			},
		},
	},
};

export const StreamingArtifact: Story = {
	args: {
		artifact: { ...mockArtifact, status: "streaming" },
		handleVersionChange: mockHandleVersionChange,
		currentVersionIndex: 0,
		isCurrentVersion: true,
		mode: "edit",
		metadata: {},
		setMetadata: () => {},
	},
	parameters: {
		docs: {
			description: {
				story: "Ações desabilitadas quando o artefato está em streaming.",
			},
		},
	},
};

export const WithVersionNavigation: Story = {
	args: {
		artifact: mockArtifact,
		handleVersionChange: mockHandleVersionChange,
		currentVersionIndex: 2,
		isCurrentVersion: false,
		mode: "edit",
		metadata: {},
		setMetadata: () => {},
	},
	parameters: {
		docs: {
			description: {
				story:
					"Ações com navegação de versão disponível (não é a versão atual).",
			},
		},
	},
};
