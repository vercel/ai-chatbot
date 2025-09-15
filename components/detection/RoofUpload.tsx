"use client";

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';

interface FilePreview {
	readonly name: string;
	readonly type: string;
	readonly size: number;
	readonly blobUrl: string;
}

interface RoofUploadProps {
        readonly persona: 'owner' | 'integrator';
        readonly onAnalyze: (files: FilePreview[]) => void;
        readonly isAnalyzing?: boolean;
}

export function RoofUpload({ persona, onAnalyze, isAnalyzing = false }: RoofUploadProps) {
	const [files, setFiles] = useState<FilePreview[]>([]);
	const [dragOver, setDragOver] = useState(false);
	const [error, setError] = useState<string>('');
	const fileInputRef = useRef<HTMLInputElement>(null);

        const maxFiles = persona === 'integrator' ? 10 : 3;
	const maxFileSize = 8 * 1024 * 1024; // 8MB
	const maxTotalSize = persona === 'integrator' ? 80 * 1024 * 1024 : 24 * 1024 * 1024; // 80MB / 24MB

	const validateFile = useCallback((file: File): string | null => {
		if (!file.type.startsWith('image/')) {
			return 'Apenas imagens são permitidas';
		}
		if (file.size > maxFileSize) {
			return 'Arquivo muito grande (máx. 8MB)';
		}
		return null;
	}, [maxFileSize]);

	const handleFiles = useCallback((newFiles: FileList | File[]) => {
		setError('');
		const fileArray = Array.from(newFiles);
		const validFiles: FilePreview[] = [];
		let totalSize = files.reduce((sum, f) => sum + f.size, 0);

		for (const file of fileArray) {
			const validationError = validateFile(file);
			if (validationError) {
				setError(validationError);
				return;
			}
			if (files.length + validFiles.length >= maxFiles) {
				setError(`Máximo ${maxFiles} arquivos`);
				return;
			}
			totalSize += file.size;
			if (totalSize > maxTotalSize) {
				setError('Tamanho total excedido');
				return;
			}
			validFiles.push({
				name: file.name,
				type: file.type,
				size: file.size,
				blobUrl: URL.createObjectURL(file),
			});
		}

		setFiles(prev => [...prev, ...validFiles]);
	}, [files, maxFiles, maxTotalSize, validateFile]);

	const handleDrop = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setDragOver(false);
		handleFiles(e.dataTransfer.files);
	}, [handleFiles]);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setDragOver(true);
	}, []);

	const handleDragLeave = useCallback(() => {
		setDragOver(false);
	}, []);

	const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			handleFiles(e.target.files);
		}
	}, [handleFiles]);

	const removeFile = (index: number) => {
		setFiles(prev => {
			const newFiles = [...prev];
			URL.revokeObjectURL(newFiles[index].blobUrl);
			newFiles.splice(index, 1);
			return newFiles;
		});
	};

	const handleAnalyze = () => {
		if (files.length === 0) {
			setError('Selecione pelo menos uma imagem');
			return;
		}
		onAnalyze(files);
	};

	return (
		<div className="glass yello-stroke p-6 rounded-lg">
			<h2 className="text-xl font-semibold mb-4">Upload de Imagens do Telhado</h2>

			<section
				className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
					dragOver ? 'border-yello-500 bg-yello-50' : 'border-gray-300'
				}`}
				onDrop={handleDrop}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				aria-label="Zona de upload de imagens"
			>
				<input
					ref={fileInputRef}
					type="file"
					multiple
					accept="image/*"
					onChange={handleFileSelect}
					className="hidden"
					aria-label="Selecionar imagens do telhado"
				/>
				<div className="space-y-4">
					<div className="text-4xl">📷</div>
					<p>Arraste imagens aqui ou <button
						type="button"
						onClick={() => fileInputRef.current?.click()}
						className="text-yello-600 hover:underline focus-yello"
					>selecione</button></p>
					<p className="text-sm text-gray-500">
						Máx. {maxFiles} imagens, 8MB cada, total {maxTotalSize / (1024 * 1024)}MB
					</p>
				</div>
			</section>

			{error && (
				<div className="mt-4 p-3 bg-red-100 text-red-700 rounded" role="alert" aria-live="polite">
					{error}
				</div>
			)}

			{files.length > 0 && (
				<div className="mt-6">
					<h3 className="text-lg font-medium mb-3">Imagens Selecionadas ({files.length})</h3>
					<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
						{files.map((file) => (
							<div key={file.name} className="relative group">
								<Image
									src={file.blobUrl}
									alt={`Preview ${file.name}`}
									width={128}
									height={128}
									className="w-full h-32 object-cover rounded border"
									aria-label={`Preview da imagem ${file.name}`}
								/>
								<button
									type="button"
									onClick={() => removeFile(files.indexOf(file))}
									className="absolute top-1 right-1 bg-red-500 text-white rounded-full size-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus-yello"
									aria-label={`Remover ${file.name}`}
								>
									×
								</button>
								<p className="text-xs mt-1 truncate" title={file.name}>{file.name}</p>
							</div>
						))}
					</div>
				</div>
			)}

			<div className="mt-6 flex justify-end">
				<button
					type="button"
					onClick={handleAnalyze}
					disabled={isAnalyzing || files.length === 0}
					className="px-6 py-2 bg-yello-600 text-white rounded hover:bg-yello-700 disabled:opacity-50 disabled:cursor-not-allowed focus-yello"
				>
					{isAnalyzing ? 'Analisando...' : 'Analisar Telhado'}
				</button>
			</div>
		</div>
	);
}