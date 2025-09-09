import type { Meta, StoryObj } from "@storybook/react";
import { AccessibilitySettings } from "./accessibility-settings";
import { AccessibilityProvider } from "@/lib/accessibility/context";
import { Button } from "./ui/button";
import { useState } from "react";

const meta: Meta<typeof AccessibilitySettings> = {
	title: "Components/Accessibility/AccessibilitySettings",
	component: AccessibilitySettings,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Modal de configurações de acessibilidade que permite personalizar alto contraste, tamanho da fonte e redução de movimento.",
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
type Story = StoryObj<typeof AccessibilitySettings>;

const SettingsWrapper = ({
	children,
	...args
}: {
	children?: React.ReactNode;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}) => {
	const [open, setOpen] = useState(false);

	return (
		<div>
			<Button onClick={() => setOpen(true)}>Abrir Configurações</Button>
			<AccessibilitySettings open={open} onOpenChange={setOpen} {...args} />
		</div>
	);
};

export const Default: Story = {
	args: {
		open: false,
		onOpenChange: () => {},
	},
	parameters: {
		docs: {
			description: {
				story: "Estado padrão do modal de configurações de acessibilidade.",
			},
		},
	},
	render: (args) => <SettingsWrapper {...args} />,
};

export const WithHighContrast: Story = {
	args: {
		open: true,
		onOpenChange: () => {},
	},
	parameters: {
		docs: {
			description: {
				story:
					"Modal aberto mostrando configurações com alto contraste ativado.",
			},
		},
	},
	decorators: [
		(Story) => (
			<AccessibilityProvider>
				<div className="high-contrast">
					<Story />
				</div>
			</AccessibilityProvider>
		),
	],
	render: (args) => <SettingsWrapper {...args} />,
};

export const LargeFontSize: Story = {
	args: {
		open: true,
		onOpenChange: () => {},
	},
	parameters: {
		docs: {
			description: {
				story: "Modal mostrando configurações com fonte grande selecionada.",
			},
		},
	},
	render: (args) => <SettingsWrapper {...args} />,
};

export const AllSettingsEnabled: Story = {
	args: {
		open: true,
		onOpenChange: () => {},
	},
	parameters: {
		docs: {
			description: {
				story:
					"Modal mostrando todas as configurações de acessibilidade ativadas simultaneamente.",
			},
		},
	},
	render: (args) => <SettingsWrapper {...args} />,
};

export const ExtraLargeFont: Story = {
	args: {
		open: true,
		onOpenChange: () => {},
	},
	parameters: {
		docs: {
			description: {
				story:
					"Modal mostrando configurações com fonte extra grande para máxima legibilidade.",
			},
		},
	},
	render: (args) => <SettingsWrapper {...args} />,
};

export const MinimalSettings: Story = {
	args: {
		open: true,
		onOpenChange: () => {},
	},
	parameters: {
		docs: {
			description: {
				story:
					"Modal mostrando configurações mínimas (normal) para usuários que não precisam de ajustes especiais.",
			},
		},
	},
	render: (args) => <SettingsWrapper {...args} />,
};
