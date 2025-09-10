// types/playwright-performance.d.ts
declare global {
	interface Performance {
		memory?: {
			usedJSHeapSize: number;
			totalJSHeapSize: number;
			jsHeapSizeLimit: number;
		};
	}
}

export {};
