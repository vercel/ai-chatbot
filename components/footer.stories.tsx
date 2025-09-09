import { Footer } from "./footer";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta: Meta<typeof Footer> = {
	component: Footer,
	title: "Layout/Footer",
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"Rodapé do site com informações da empresa, links e configurações de acessibilidade.",
			},
		},
	},
};
export default meta;

export const Default: StoryObj<typeof Footer> = {
	args: {},
	parameters: {
		docs: {
			description: {
				story: "Estado padrão do rodapé com todas as seções.",
			},
		},
	},
};

export const WithCustomClass: StoryObj<typeof Footer> = {
	args: {
		className: "bg-gray-100 dark:bg-gray-800",
	},
	parameters: {
		docs: {
			description: {
				story: "Rodapé com classe customizada para alteração de background.",
			},
		},
	},
};

export const Compact: StoryObj<typeof Footer> = {
	args: {
		className: "py-4",
	},
	parameters: {
		docs: {
			description: {
				story: "Rodapé com padding reduzido para layout mais compacto.",
			},
		},
	},
};

export const MobileView: StoryObj<typeof Footer> = {
	args: {},
	parameters: {
		viewport: {
			defaultViewport: "mobile1",
		},
		docs: {
			description: {
				story: "Rodapé em visualização mobile com layout responsivo.",
			},
		},
	},
};

export const DarkMode: StoryObj<typeof Footer> = {
	args: {},
	parameters: {
		backgrounds: {
			default: "dark",
		},
		docs: {
			description: {
				story: "Rodapé em modo escuro.",
			},
		},
	},
};