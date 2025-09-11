"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RoofUpload } from '@/components/detection/RoofUpload';
import { DetectionReport } from '@/components/detection/DetectionReport';
import { analyzeRoofAction } from '@/app/actions/analyzeRoofAction';
import type { DetectionResult } from '@/lib/detection/types';

export default function DetectionPage() {
	const [result, setResult] = useState<DetectionResult | null>(null);
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [error, setError] = useState<string>('');
	const router = useRouter();

	const persona: 'owner' | 'integrator' = 'owner'; // Hardcoded, integrar com contexto

	const handleAnalyze = async (files: Array<{ name: string; type: string; size: number; blobUrl: string }>) => {
		setIsAnalyzing(true);
		setError('');

		try {
			const formData = new FormData();
			formData.append('persona', persona);
			for (const file of files) {
        // Converter blobUrl para File (assumir que é blob)
        const res = await fetch(file.blobUrl);
        const blob = await res.blob();
        const fileObj = new File([blob], file.name, { type: file.type });
        formData.append("files", fileObj);
      }

			const response = await analyzeRoofAction(formData);

			if (response.success && response.data) {
				setResult(response.data);
			} else {
				setError(response.error || 'Erro na análise');
			}
		} catch (err) {
			console.error('Erro ao processar análise:', err);
			setError('Erro ao processar análise');
		} finally {
			setIsAnalyzing(false);
		}
	};

	const handleProceed = () => {
		router.push('/journey/analysis');
	};

	const handleBack = () => {
		router.push('/journey');
	};

	const handleExport = () => {
		// Implementar export CSV
		alert('Exportar CSV - funcionalidade a implementar');
	};

	if (result) {
		return (
			<div className="container mx-auto py-8">
				<DetectionReport
					result={result}
					persona={persona}
					onProceed={handleProceed}
					onBack={handleBack}
					onExport={handleExport}
				/>
			</div>
		);
	}

	return (
		<div className="container mx-auto py-8">
			<RoofUpload
				onAnalyze={handleAnalyze}
				isAnalyzing={isAnalyzing}
			/>
			{error && (
				<div className="mt-4 p-3 bg-red-100 text-red-700 rounded" role="alert" aria-live="polite">
					{error}
				</div>
			)}
		</div>
	);
}