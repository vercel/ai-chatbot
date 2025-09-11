"use client";

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import type { DetectionResult } from '@/lib/detection/types';

interface DetectionReportProps {
	readonly result: DetectionResult;
	readonly persona: 'owner' | 'integrator';
	readonly onProceed: () => void;
	readonly onBack: () => void;
	readonly onExport?: () => void;
}

export function DetectionReport({ result, persona, onProceed, onBack, onExport }: DetectionReportProps) {
	const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);

	useEffect(() => {
		result.items.forEach((item, index) => {
			const canvas = canvasRefs.current[index];
			if (!canvas || !item.overlays?.bboxes) return;

			const ctx = canvas.getContext('2d');
			if (!ctx) return;

			// Assumir dimensões da imagem, ajustar conforme necessário
			const imgWidth = 300;
			const imgHeight = 200;

			canvas.width = imgWidth;
			canvas.height = imgHeight;

			ctx.clearRect(0, 0, imgWidth, imgHeight);

			// Desenhar bboxes
			ctx.strokeStyle = '#ff0000';
			ctx.lineWidth = 2;
			for (const bbox of item.overlays.bboxes) {
				ctx.strokeRect(bbox.x, bbox.y, bbox.w, bbox.h);
				if (bbox.score) {
					ctx.fillStyle = '#ff0000';
					ctx.fillText(bbox.score.toFixed(2), bbox.x, bbox.y - 5);
				}
			}
		});
	}, [result]);

	return (
		<div className="glass yello-stroke p-6 rounded-lg">
			<h2 className="text-xl font-semibold mb-4">Relatório de Detecção</h2>

			{/* Grade de imagens */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
				{result.items.map((item, index) => (
					<div key={item.input.name} className="relative">
						<Image
							src={item.input.url}
							alt={`Imagem ${item.input.name}`}
							width={300}
							height={200}
							className="w-full h-auto rounded border"
						/>
						{item.overlays?.maskUrl && (
							<Image
								src={item.overlays.maskUrl}
								alt="Máscara do telhado"
								width={300}
								height={200}
								className="absolute top-0 left-0 w-full h-auto opacity-50"
							/>
						)}
						<canvas
							ref={(el) => { canvasRefs.current[index] = el; }}
							className="absolute top-0 left-0 w-full h-auto pointer-events-none"
						/>
						<div className="mt-2 text-sm">
							<p><strong>Arquivo:</strong> {item.input.name}</p>
							{item.metrics && (
								<>
									<p><strong>Área do telhado:</strong> {item.metrics.roof_coverage_m2?.toFixed(1)} m²</p>
									<p><strong>Painéis detectados:</strong> {item.metrics.panel_count}</p>
									<p><strong>Confiança:</strong> {item.metrics.confidence ? (item.metrics.confidence * 100).toFixed(1) : 'N/A'}%</p>
									{item.metrics.orientation && <p><strong>Orientação:</strong> {item.metrics.orientation}</p>}
									{item.metrics.tilt_deg && <p><strong>Inclinação:</strong> {item.metrics.tilt_deg}°</p>}
								</>
							)}
						</div>
					</div>
				))}
			</div>

			{/* Resumo */}
			<div className="mb-6">
				<h3 className="text-lg font-medium mb-2">Resumo</h3>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
					<div>
						<p className="font-medium">Área total do telhado</p>
						<p>{result.summary.roof_total_m2?.toFixed(1)} m²</p>
					</div>
					<div>
						<p className="font-medium">Painéis detectados</p>
						<p>{result.summary.detected_panels}</p>
					</div>
					<div>
						<p className="font-medium">Confiança média</p>
						<p>{result.summary.confidence_avg ? (result.summary.confidence_avg * 100).toFixed(1) : 'N/A'}%</p>
					</div>
					<div>
						<p className="font-medium">Recomendações</p>
						<ul className="list-disc list-inside">
							{result.summary.recommendations.map((rec) => (
								<li key={rec}>{rec}</li>
							))}
						</ul>
					</div>
				</div>
			</div>

			{/* CTAs */}
			<div className="flex justify-between">
				<button
					type="button"
					onClick={onBack}
					className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 focus-yello"
				>
					Voltar para jornada
				</button>
				<div className="space-x-4">
					{persona === 'integrator' && onExport && (
						<button
							type="button"
							onClick={onExport}
							className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus-yello"
						>
							Exportar CSV
						</button>
					)}
					<button
						type="button"
						onClick={onProceed}
						className="px-6 py-2 bg-yello-600 text-white rounded hover:bg-yello-700 focus-yello"
					>
						Prosseguir para Análise
					</button>
				</div>
			</div>
		</div>
	);
}