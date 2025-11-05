"use client";

import { useState } from "react";
import { useChat } from "ai/react";

interface DocumentAnalyzerProps {
  userId: string;
}

interface AnalysisResult {
  id: string;
  fileName: string;
  documentType: string;
  summary: string;
  keyPoints: string[];
  risks: string[];
  recommendations: string[];
  timestamp: string;
}

export function DocumentAnalyzer({ userId }: DocumentAnalyzerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/legal/analyze",
    onFinish: (message) => {
      // Parse AI response and add to results
      try {
        const result = JSON.parse(message.content);
        setAnalysisResults(prev => [result, ...prev]);
      } catch (error) {
        console.error("Failed to parse analysis result:", error);
      }
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const analyzeDocument = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    
    try {
      // In a real implementation, you'd upload the file and extract text
      const mockDocumentText = `
        EMPLOYMENT AGREEMENT
        
        This Employment Agreement is entered into between ABC Corp and John Doe.
        
        1. Position: Senior Software Engineer
        2. Salary: $120,000 per year
        3. Benefits: Health insurance, 401k matching
        4. Termination: Either party may terminate with 30 days notice
        5. Non-compete: Employee agrees not to work for competitors for 1 year
        6. Confidentiality: Employee must maintain confidentiality of company information
      `;

      // Send to AI for analysis
      const analysisPrompt = `
        Analyze this legal document and provide:
        1. Document type classification
        2. Executive summary
        3. Key terms and provisions
        4. Potential legal risks
        5. Recommendations for review
        
        Document content:
        ${mockDocumentText}
        
        Respond in JSON format with fields: documentType, summary, keyPoints, risks, recommendations
      `;

      // Simulate AI analysis
      const mockResult: AnalysisResult = {
        id: Date.now().toString(),
        fileName: selectedFile.name,
        documentType: "Employment Agreement",
        summary: "Standard employment agreement with competitive salary and benefits. Contains non-compete clause that may need review.",
        keyPoints: [
          "Annual salary of $120,000",
          "Standard benefits package included",
          "30-day termination notice required",
          "1-year non-compete restriction",
          "Confidentiality obligations"
        ],
        risks: [
          "Non-compete clause may be overly broad",
          "Termination clause lacks severance provisions",
          "IP assignment terms not clearly defined"
        ],
        recommendations: [
          "Review non-compete enforceability in jurisdiction",
          "Consider adding severance terms",
          "Clarify intellectual property ownership",
          "Add dispute resolution mechanism"
        ],
        timestamp: new Date().toISOString()
      };

      setAnalysisResults(prev => [mockResult, ...prev]);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
      setSelectedFile(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">📄 Document Analysis</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Upload Legal Document
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          
          {selectedFile && (
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </span>
              <button
                onClick={analyzeDocument}
                disabled={isAnalyzing}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isAnalyzing ? "Analyzing..." : "Analyze Document"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Analysis Results */}
      <div className="space-y-4">
        {analysisResults.map((result) => (
          <div key={result.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{result.fileName}</h3>
                <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded">
                  {result.documentType}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(result.timestamp).toLocaleString()}
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">📋 Summary</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  {result.summary}
                </p>

                <h4 className="font-medium text-gray-900 dark:text-white mb-2">🔑 Key Points</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  {result.keyPoints.map((point, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-red-600 mb-2">⚠️ Potential Risks</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 mb-4">
                  {result.risks.map((risk, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      {risk}
                    </li>
                  ))}
                </ul>

                <h4 className="font-medium text-blue-600 mb-2">💡 Recommendations</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  {result.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {analysisResults.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">📄</div>
          <p>Upload a legal document to get started with AI-powered analysis</p>
        </div>
      )}
    </div>
  );
}