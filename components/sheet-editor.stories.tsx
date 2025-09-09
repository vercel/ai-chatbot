import { SpreadsheetEditor } from "./sheet-editor";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ThemeProvider } from "next-themes";

const meta: Meta<typeof SpreadsheetEditor> = {
	component: SpreadsheetEditor,
	title: "Editors/SpreadsheetEditor",
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"Editor de planilhas interativo com suporte a CSV, virtualização e edição em tempo real.",
			},
		},
	},
	decorators: [
		(Story) => (
			<ThemeProvider attribute="class" defaultTheme="light" enableSystem>
				<div className="h-screen w-full">
					<Story />
				</div>
			</ThemeProvider>
		),
	],
};

export default meta;

type Story = StoryObj<typeof SpreadsheetEditor>;

const mockSaveContent = (content: string, isCurrentVersion: boolean) => {
	console.log("Content saved:", content, "Current version:", isCurrentVersion);
};

export const Default: Story = {
	args: {
		content:
			"Month,Electricity Bill,Solar Generation,Savings\nJan,320,280,40\nFeb,290,310,0\nMar,350,320,30",
		saveContent: mockSaveContent,
		status: "idle",
		isCurrentVersion: true,
		currentVersionIndex: 0,
	},
	parameters: {
		docs: {
			description: {
				story:
					"Planilha padrão com dados de consumo de energia e geração solar.",
			},
		},
	},
};

export const Empty: Story = {
	args: {
		content: "",
		saveContent: mockSaveContent,
		status: "idle",
		isCurrentVersion: true,
		currentVersionIndex: 0,
	},
	parameters: {
		docs: {
			description: {
				story: "Planilha vazia pronta para edição.",
			},
		},
	},
};

export const Streaming: Story = {
	args: {
		content: "Loading,Data,From,AI\nPlease,Wait,Data,Is,Streaming",
		saveContent: mockSaveContent,
		status: "streaming",
		isCurrentVersion: false,
		currentVersionIndex: 1,
	},
	parameters: {
		docs: {
			description: {
				story: "Estado de streaming mostrando dados sendo carregados.",
			},
		},
	},
};

export const LargeDataset: Story = {
	args: {
		content: Array.from({ length: 100 }, (_, i) =>
			Array.from({ length: 10 }, (_, j) => `Row${i + 1}Col${j + 1}`).join(","),
		).join("\n"),
		saveContent: mockSaveContent,
		status: "idle",
		isCurrentVersion: true,
		currentVersionIndex: 0,
	},
	parameters: {
		docs: {
			description: {
				story: "Dataset grande para testar virtualização e performance.",
			},
		},
	},
};