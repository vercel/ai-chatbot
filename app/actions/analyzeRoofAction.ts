"use server";

import { analyzeRoofDetection } from '@/lib/detection/service';
import type { DetectionResult } from '@/lib/detection/types';

export async function analyzeRoofAction(formData: FormData): Promise<{
	success: boolean;
	data?: DetectionResult;
	error?: string;
}> {
	try {
		const persona = (formData.get('persona') as string) || 'owner';
		const files = formData.getAll('files') as File[];

		if (files.length === 0) {
			return { success: false, error: 'Nenhuma imagem fornecida' };
		}

		// Validar arquivos
		const maxFileSize = 8 * 1024 * 1024; // 8MB
		const maxFiles = persona === 'integrator' ? 10 : 3;
		const maxTotalSize = persona === 'integrator' ? 80 * 1024 * 1024 : 24 * 1024 * 1024;

		if (files.length > maxFiles) {
			return { success: false, error: `Máximo ${maxFiles} arquivos` };
		}

		let totalSize = 0;
		const filePreviews = [];

		for (const file of files) {
			if (!file.type.startsWith('image/')) {
				return { success: false, error: 'Apenas imagens são permitidas' };
			}
			if (file.size > maxFileSize) {
				return { success: false, error: 'Arquivo muito grande (máx. 8MB)' };
			}
			totalSize += file.size;

			// Criar blob URL (no server, simular)
			const buffer = await file.arrayBuffer();
			const blob = new Blob([buffer], { type: file.type });
			const url = URL.createObjectURL(blob); // Nota: no server, isso não funciona, mas para mock

			filePreviews.push({
				name: file.name,
				url,
				type: file.type,
				size: file.size,
			});
		}

		if (totalSize > maxTotalSize) {
			return { success: false, error: 'Tamanho total excedido' };
		}

		// Chamar análise
		const result = await analyzeRoofDetection(filePreviews, persona as 'owner' | 'integrator');

		return { success: true, data: result };
	} catch (error) {
		console.error('Erro na análise:', error);
		return { success: false, error: 'Erro interno na análise' };
	}
}