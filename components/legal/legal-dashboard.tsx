"use client";

import { useState } from "react";
import { DocumentAnalyzer } from "./document-analyzer";
import { CaseManager } from "./case-manager";
import { LegalResearch } from "./legal-research";
import { ClientPortal } from "./client-portal";
import { BillingTracker } from "./billing-tracker";

interface LegalDashboardProps {
  userId: string;
}

type ActiveTab = "documents" | "cases" | "research" | "clients" | "billing";

export function LegalDashboard({ userId }: LegalDashboardProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("documents");

  const tabs = [
    { id: "documents" as const, label: "📄 Documents", icon: "📄" },
    { id: "cases" as const, label: "⚖️ Cases", icon: "⚖️" },
    { id: "research" as const, label: "🔍 Research", icon: "🔍" },
    { id: "clients" as const, label: "👥 Clients", icon: "👥" },
    { id: "billing" as const, label: "💰 Billing", icon: "💰" },
  ];

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "documents" && <DocumentAnalyzer userId={userId} />}
        {activeTab === "cases" && <CaseManager userId={userId} />}
        {activeTab === "research" && <LegalResearch userId={userId} />}
        {activeTab === "clients" && <ClientPortal userId={userId} />}
        {activeTab === "billing" && <BillingTracker userId={userId} />}
      </div>
    </div>
  );
}