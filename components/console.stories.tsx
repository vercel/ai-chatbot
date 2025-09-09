import type { Meta, StoryObj } from "@storybook/react";
import { Console, type ConsoleOutput } from "./console";
import { useState } from "react";
import { Button } from "./ui/button";

const meta: Meta<typeof Console> = {
	title: "Components/Console",
	component: Console,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"Componente de console que exibe saídas de execução com diferentes status e tipos de conteúdo.",
			},
		},
	},
};

export default meta;
type Story = StoryObj<typeof Console>;

const ConsoleWrapper = () => {
	const [consoleOutputs, setConsoleOutputs] = useState<ConsoleOutput[]>([]);

	const addCompletedOutput = () => {
		const newOutput: ConsoleOutput = {
			id: Date.now().toString(),
			status: "completed",
			contents: [
				{ type: "text", value: "npm install completed successfully" },
				{ type: "text", value: "Dependencies installed in 2.3s" },
			],
		};
		setConsoleOutputs((prev) => [...prev, newOutput]);
	};

	const addFailedOutput = () => {
		const newOutput: ConsoleOutput = {
			id: Date.now().toString(),
			status: "failed",
			contents: [
				{ type: "text", value: "Error: Cannot find module 'react'" },
				{ type: "text", value: "Please run npm install first" },
			],
		};
		setConsoleOutputs((prev) => [...prev, newOutput]);
	};

	const addInProgressOutput = () => {
		const newOutput: ConsoleOutput = {
			id: Date.now().toString(),
			status: "in_progress",
			contents: [{ type: "text", value: "Building application..." }],
		};
		setConsoleOutputs((prev) => [...prev, newOutput]);
	};

	const clearConsole = () => {
		setConsoleOutputs([]);
	};

	return (
		<div className="relative h-screen">
			<div className="p-4 space-x-2">
				<Button onClick={addCompletedOutput}>Adicionar Saída Completa</Button>
				<Button onClick={addFailedOutput} variant="destructive">
					Adicionar Erro
				</Button>
				<Button onClick={addInProgressOutput} variant="secondary">
					Adicionar Em Progresso
				</Button>
				<Button onClick={clearConsole} variant="outline">
					Limpar Console
				</Button>
			</div>
			<Console
				consoleOutputs={consoleOutputs}
				setConsoleOutputs={setConsoleOutputs}
			/>
		</div>
	);
};

export const Default: Story = {
	args: {
		consoleOutputs: [],
		setConsoleOutputs: () => {},
	},
	parameters: {
		docs: {
			description: {
				story: "Estado padrão do console sem saídas.",
			},
		},
	},
	render: () => <ConsoleWrapper />,
};

export const WithCompletedOutput: Story = {
	args: {
		consoleOutputs: [
			{
				id: "1",
				status: "completed",
				contents: [
					{ type: "text", value: "Build completed successfully" },
					{ type: "text", value: "Output: dist/main.js (2.1 MB)" },
				],
			},
		],
		setConsoleOutputs: () => {},
	},
	parameters: {
		docs: {
			description: {
				story: "Console mostrando saída de compilação bem-sucedida.",
			},
		},
	},
};

export const WithFailedOutput: Story = {
	args: {
		consoleOutputs: [
			{
				id: "2",
				status: "failed",
				contents: [
					{ type: "text", value: "TypeScript compilation failed" },
					{
						type: "text",
						value: "Error: Property 'name' does not exist on type 'User'",
					},
				],
			},
		],
		setConsoleOutputs: () => {},
	},
	parameters: {
		docs: {
			description: {
				story: "Console mostrando erro de compilação.",
			},
		},
	},
};

export const WithInProgressOutput: Story = {
	args: {
		consoleOutputs: [
			{
				id: "3",
				status: "in_progress",
				contents: [{ type: "text", value: "Installing dependencies..." }],
			},
		],
		setConsoleOutputs: () => {},
	},
	parameters: {
		docs: {
			description: {
				story: "Console mostrando processo em andamento.",
			},
		},
	},
};
