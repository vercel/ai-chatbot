import { AuthForm } from "./auth-form";
import { Button } from "./ui/button";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta: Meta<typeof AuthForm> = {
	component: AuthForm,
	title: "Auth/AuthForm",
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component: "Formulário de autenticação com campos de email e senha.",
			},
		},
	},
};
export default meta;

export const Default: StoryObj<typeof AuthForm> = {
	args: {
		action: "/api/auth",
		children: <Button type="submit">Sign In</Button>,
	},
	parameters: {
		docs: {
			description: {
				story: "Estado padrão do formulário de autenticação.",
			},
		},
	},
};

export const WithDefaultEmail: StoryObj<typeof AuthForm> = {
	args: {
		action: "/api/auth",
		defaultEmail: "user@example.com",
		children: <Button type="submit">Sign In</Button>,
	},
	parameters: {
		docs: {
			description: {
				story: "Formulário com email pré-preenchido.",
			},
		},
	},
};

export const WithLoadingButton: StoryObj<typeof AuthForm> = {
	args: {
		action: "/api/auth",
		children: (
			<Button type="submit" disabled>
				<div className="flex items-center gap-2">
					<div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
					Signing In...
				</div>
			</Button>
		),
	},
	parameters: {
		docs: {
			description: {
				story: "Formulário com botão em estado de loading.",
			},
		},
	},
};

export const WithErrorMessage: StoryObj<typeof AuthForm> = {
	args: {
		action: "/api/auth",
		children: (
			<div className="space-y-2">
				<div className="text-red-500 text-sm">
					Invalid email or password. Please try again.
				</div>
				<Button type="submit">Try Again</Button>
			</div>
		),
	},
	parameters: {
		docs: {
			description: {
				story: "Formulário mostrando mensagem de erro.",
			},
		},
	},
};

export const WithSignUpLink: StoryObj<typeof AuthForm> = {
	args: {
		action: "/api/auth",
		children: (
			<div className="space-y-4">
				<Button type="submit">Sign In</Button>
				<div className="text-center text-sm">
					Don&apos;t have an account?{" "}
					<a href="/signup" className="text-blue-500 hover:underline">
						Sign up
					</a>
				</div>
			</div>
		),
	},
	parameters: {
		docs: {
			description: {
				story: "Formulário com link para cadastro.",
			},
		},
	},
};