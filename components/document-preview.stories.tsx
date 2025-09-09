import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DocumentPreview } from "./document-preview";
import { SWRConfig } from "swr";
import type { UIArtifact } from "./artifact";

const meta: Meta<typeof DocumentPreview> = {
	title: "Components/Document/DocumentPreview",
	component: DocumentPreview,
	parameters: {
		layout: "padded",
		docs: {
			description: {
				component:
					"Preview interativo de documentos com suporte a texto, código, planilhas e imagens. Inclui expansão para visualização completa.",
			},
		},
	},
	decorators: [
		(Story) => (
			<div className="w-full max-w-2xl">
				<SWRConfig value={{ provider: () => new Map() }}>
					<Story />
				</SWRConfig>
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof DocumentPreview>;

const mockArtifactText: UIArtifact = {
	documentId: "doc-123",
	content:
		"# Análise de Conta de Luz\n\nConsumo médio: 450 kWh/mês\nCusto médio: R$ 280,00",
	kind: "text",
	title: "Análise Conta de Luz",
	status: "idle",
	isVisible: false,
	boundingBox: {
		top: 0,
		left: 0,
		width: 400,
		height: 300,
	},
};

const mockArtifactCode: UIArtifact = {
	...mockArtifactText,
	content:
		"function calculateSolarSavings(monthlyBill, solarGeneration) {\n  return monthlyBill - (solarGeneration * 0.75);\n}",
	kind: "code",
	title: "Cálculo Economia Solar",
};

const mockArtifactSheet: UIArtifact = {
	...mockArtifactText,
	content:
		"Month,Electricity Bill,Solar Generation,Savings\nJan,320,280,40\nFeb,290,310,0",
	kind: "sheet",
	title: "Dados Consumo Mensal",
};

const mockArtifactImage: UIArtifact = {
	...mockArtifactText,
	content:
		"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
	kind: "image",
	title: "Foto Telhado",
};

export const TextDocument: Story = {
	args: {
		isReadonly: false,
		result: {
			id: "doc-123",
			title: "Análise Conta de Luz",
			kind: "text",
		},
	},
	parameters: {
		docs: {
			description: {
				story: "Preview de documento de texto com formatação Markdown.",
			},
		},
		swr: {
			fallbackData: {
				artifact: mockArtifactText,
			},
		},
	},
};

export const CodeDocument: Story = {
	args: {
		isReadonly: false,
		result: {
			id: "doc-456",
			title: "Cálculo Economia Solar",
			kind: "code",
		},
	},
	parameters: {
		docs: {
			description: {
				story: "Preview de documento de código com syntax highlighting.",
			},
		},
		swr: {
			fallbackData: {
				artifact: mockArtifactCode,
			},
		},
	},
};

export const SheetDocument: Story = {
	args: {
		isReadonly: false,
		result: {
			id: "doc-789",
			title: "Dados Consumo Mensal",
			kind: "sheet",
		},
	},
	parameters: {
		docs: {
			description: {
				story: "Preview de planilha com dados tabulares editáveis.",
			},
		},
		swr: {
			fallbackData: {
				artifact: mockArtifactSheet,
			},
		},
	},
};

export const ImageDocument: Story = {
	args: {
		isReadonly: false,
		result: {
			id: "doc-101",
			title: "Foto Telhado",
			kind: "image",
		},
	},
	parameters: {
		docs: {
			description: {
				story: "Preview de imagem com ferramentas de edição.",
			},
		},
		swr: {
			fallbackData: {
				artifact: mockArtifactImage,
			},
		},
	},
};

export const ReadOnly: Story = {
	args: {
		...TextDocument.args,
		isReadonly: true,
	},
	parameters: {
		docs: {
			description: {
				story: "Modo somente leitura desabilitando edição do documento.",
			},
		},
		swr: {
			fallbackData: {
				artifact: mockArtifactText,
			},
		},
	},
};

export const ToolCall: Story = {
	args: {
		isReadonly: false,
		args: {
			title: "Novo Documento",
			kind: "text",
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					"Estado de criação de documento mostrando chamada de ferramenta.",
			},
		},
		swr: {
			fallbackData: {
				artifact: {
					...mockArtifactText,
					isVisible: true,
				},
			},
		},
	},
};
