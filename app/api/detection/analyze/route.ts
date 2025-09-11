import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { analyzeRoofDetection } from '@/lib/detection/service';

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();
		const persona = (formData.get('persona') as string) || 'owner';
		const files = formData.getAll('files') as File[];

		if (files.length === 0) {
			return NextResponse.json({ error: 'Nenhuma imagem fornecida' }, { status: 400 });
		}

		// Validar arquivos
		const maxFileSize = 8 * 1024 * 1024; // 8MB
		const maxFiles = persona === 'integrator' ? 10 : 3;
		const maxTotalSize = persona === 'integrator' ? 80 * 1024 * 1024 : 24 * 1024 * 1024;

		if (files.length > maxFiles) {
			return NextResponse.json({ error: `Máximo ${maxFiles} arquivos` }, { status: 400 });
		}

		let totalSize = 0;
		const filePreviews = [];

		for (const file of files) {
			if (!file.type.startsWith('image/')) {
				return NextResponse.json({ error: 'Apenas imagens são permitidas' }, { status: 400 });
			}
			if (file.size > maxFileSize) {
				return NextResponse.json({ error: 'Arquivo muito grande (máx. 8MB)' }, { status: 400 });
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
			return NextResponse.json({ error: 'Tamanho total excedido' }, { status: 400 });
		}

		// Chamar análise
		const result = await analyzeRoofDetection(filePreviews, persona as 'owner' | 'integrator');

		return NextResponse.json(result);
	} catch (error) {
		console.error('Erro na análise:', error);
		return NextResponse.json({ error: 'Erro interno na análise' }, { status: 500 });
	}
}