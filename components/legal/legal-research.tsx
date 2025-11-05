"use client";

import { useState } from "react";
import { useChat } from "ai/react";

interface LegalResearchProps {
  userId: string;
}

interface ResearchResult {
  id: string;
  query: string;
  caseLaw: CaseLawResult[];
  statutes: StatuteResult[];
  summary: string;
  timestamp: string;
}

interface CaseLawResult {
  title: string;
  citation: string;
  court: string;
  year: string;
  relevance: number;
  summary: string;
  keyHolding: string;
}

interface StatuteResult {
  title: string;
  citation: string;
  jurisdiction: string;
  section: string;
  text: string;
  relevance: number;
}

export function LegalResearch({ userId }: LegalResearchProps) {
  const [researchHistory, setResearchHistory] = useState<ResearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/legal/research",
    onFinish: (message) => {
      // In a real implementation, this would parse the AI response
      console.log("Research completed:", message.content);
    },
  });

  const performResearch = async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);

    try {
      // Mock research results - in production, this would call legal databases
      const mockResult: ResearchResult = {
        id: Date.now().toString(),
        query: query,
        caseLaw: [
          {
            title: "Smith v. Jones",
            citation: "123 F.3d 456 (9th Cir. 2020)",
            court: "9th Circuit Court of Appeals",
            year: "2020",
            relevance: 95,
            summary: "Court held that employment contracts with overly broad non-compete clauses are unenforceable as restraints on trade.",
            keyHolding: "Non-compete clauses must be reasonable in scope, duration, and geographic limitation to be enforceable."
          },
          {
            title: "Johnson v. ABC Corp",
            citation: "456 F.Supp.3d 789 (S.D.N.Y. 2019)",
            court: "Southern District of New York",
            year: "2019",
            relevance: 87,
            summary: "District court found that one-year non-compete period was reasonable for senior executive position.",
            keyHolding: "Duration of non-compete must be proportional to employee's access to confidential information and client relationships."
          },
          {
            title: "Williams v. Tech Solutions Inc.",
            citation: "789 F.3d 123 (2nd Cir. 2021)",
            court: "2nd Circuit Court of Appeals",
            year: "2021",
            relevance: 82,
            summary: "Court invalidated non-compete clause that prevented employee from working in entire technology sector.",
            keyHolding: "Non-compete restrictions cannot be so broad as to prevent employee from earning a livelihood in their chosen profession."
          }
        ],
        statutes: [
          {
            title: "California Business and Professions Code",
            citation: "Cal. Bus. & Prof. Code § 16600",
            jurisdiction: "California",
            section: "16600",
            text: "Except as provided in this chapter, every contract by which anyone is restrained from engaging in a lawful profession, trade, or business of any kind is to that extent void.",
            relevance: 98
          },
          {
            title: "New York Labor Law",
            citation: "N.Y. Lab. Law § 191-d",
            jurisdiction: "New York",
            section: "191-d",
            text: "No employer shall seek to have an employee agree to a covenant not to compete unless the employee's annualized base salary exceeds the threshold amount.",
            relevance: 85
          }
        ],
        summary: "Research on non-compete clause enforceability reveals significant jurisdictional variations. California generally prohibits non-compete agreements, while other states allow them with reasonable restrictions on scope, duration, and geography. Recent trends show courts scrutinizing these clauses more closely, particularly for lower-wage workers.",
        timestamp: new Date().toISOString()
      };

      setResearchHistory(prev => [mockResult, ...prev]);
    } catch (error) {
      console.error("Research failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      performResearch(input);
    }
  };

  const quickSearches = [
    "Non-compete clause enforceability",
    "Employment discrimination statute of limitations",
    "Contract breach remedies",
    "Intellectual property assignment",
    "Wrongful termination damages",
    "Trade secret protection"
  ];

  return (
    <div className="space-y-6">
      {/* Search Interface */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">🔍 Legal Research Assistant</h2>
        
        <form onSubmit={handleResearchSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Research Query
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Enter your legal research question..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <button
                type="submit"
                disabled={isSearching || !input.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSearching ? "Searching..." : "Research"}
              </button>
            </div>
          </div>
        </form>

        {/* Quick Searches */}
        <div className="mt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Quick searches:</p>
          <div className="flex flex-wrap gap-2">
            {quickSearches.map((search, index) => (
              <button
                key={index}
                onClick={() => performResearch(search)}
                className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Research Results */}
      <div className="space-y-6">
        {researchHistory.map((result) => (
          <div key={result.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                "{result.query}"
              </h3>
              <span className="text-xs text-gray-500">
                {new Date(result.timestamp).toLocaleString()}
              </span>
            </div>

            {/* Summary */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">📋 Research Summary</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                {result.summary}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Case Law */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">⚖️ Relevant Case Law</h4>
                <div className="space-y-4">
                  {result.caseLaw.map((case_, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-sm text-gray-900 dark:text-white">
                          {case_.title}
                        </h5>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          {case_.relevance}% match
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        {case_.citation} • {case_.court} ({case_.year})
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        {case_.summary}
                      </p>
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                        <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200">
                          Key Holding: {case_.keyHolding}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Statutes */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">📜 Relevant Statutes</h4>
                <div className="space-y-4">
                  {result.statutes.map((statute, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-sm text-gray-900 dark:text-white">
                          {statute.title}
                        </h5>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {statute.relevance}% match
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        {statute.citation} • {statute.jurisdiction}
                      </p>
                      <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                        <p className="text-xs text-gray-700 dark:text-gray-300">
                          {statute.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex justify-end space-x-2">
              <button className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600">
                📄 Export to PDF
              </button>
              <button className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                📎 Add to Case
              </button>
              <button className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200">
                📧 Share with Client
              </button>
            </div>
          </div>
        ))}
      </div>

      {researchHistory.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-lg mb-2">AI-Powered Legal Research</p>
          <p className="text-sm">
            Search case law, statutes, and regulations with natural language queries
          </p>
        </div>
      )}
    </div>
  );
}