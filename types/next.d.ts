declare module "process" {
	global {
		namespace NodeJS {
			interface ProcessEnv {
				NODE_ENV: string;
				POSTGRES_URL: string;
				AUTH_SECRET: string;
			}
		}
	}
}
