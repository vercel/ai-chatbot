"use client";

import { useState } from "react";

interface CaseManagerProps {
  userId: string;
}

interface LegalCase {
  id: string;
  title: string;
  client: string;
  caseType: string;
  status: "active" | "pending" | "closed" | "on-hold";
  priority: "low" | "medium" | "high" | "urgent";
  nextDeadline: string;
  description: string;
  createdAt: string;
  lastUpdated: string;
}

interface CaseEvent {
  id: string;
  caseId: string;
  type: "filing" | "hearing" | "deadline" | "meeting" | "document";
  title: string;
  date: string;
  description: string;
  completed: boolean;
}

export function CaseManager({ userId }: CaseManagerProps) {
  const [cases, setCases] = useState<LegalCase[]>([
    {
      id: "1",
      title: "Smith vs. ABC Corp - Employment Dispute",
      client: "John Smith",
      caseType: "Employment Law",
      status: "active",
      priority: "high",
      nextDeadline: "2024-02-15",
      description: "Wrongful termination case involving discrimination claims",
      createdAt: "2024-01-10",
      lastUpdated: "2024-01-28"
    },
    {
      id: "2",
      title: "Johnson Contract Review",
      client: "Sarah Johnson",
      caseType: "Contract Law",
      status: "pending",
      priority: "medium",
      nextDeadline: "2024-02-20",
      description: "Review and negotiation of commercial lease agreement",
      createdAt: "2024-01-15",
      lastUpdated: "2024-01-25"
    },
    {
      id: "3",
      title: "Estate Planning - Williams Family",
      client: "Robert Williams",
      caseType: "Estate Planning",
      status: "active",
      priority: "low",
      nextDeadline: "2024-03-01",
      description: "Comprehensive estate planning including will and trust setup",
      createdAt: "2024-01-05",
      lastUpdated: "2024-01-20"
    }
  ]);

  const [events, setEvents] = useState<CaseEvent[]>([
    {
      id: "1",
      caseId: "1",
      type: "deadline",
      title: "Discovery Deadline",
      date: "2024-02-15",
      description: "All discovery materials must be submitted",
      completed: false
    },
    {
      id: "2",
      caseId: "1",
      type: "hearing",
      title: "Motion Hearing",
      date: "2024-02-22",
      description: "Hearing on motion to dismiss",
      completed: false
    },
    {
      id: "3",
      caseId: "2",
      type: "meeting",
      title: "Client Meeting",
      date: "2024-02-10",
      description: "Review contract terms with client",
      completed: true
    }
  ]);

  const [selectedCase, setSelectedCase] = useState<LegalCase | null>(null);
  const [showNewCaseForm, setShowNewCaseForm] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "closed": return "bg-gray-100 text-gray-800";
      case "on-hold": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getCaseEvents = (caseId: string) => {
    return events.filter(event => event.caseId === caseId);
  };

  const upcomingDeadlines = events
    .filter(event => !event.completed && new Date(event.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {cases.filter(c => c.status === "active").length}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Cases</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {upcomingDeadlines.length}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Upcoming Deadlines</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {cases.filter(c => c.priority === "high" || c.priority === "urgent").length}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">High Priority</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <button
            onClick={() => setShowNewCaseForm(true)}
            className="w-full h-full flex items-center justify-center text-blue-600 hover:text-blue-800 font-medium"
          >
            + New Case
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cases List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold">⚖️ Active Cases</h2>
          
          {cases.map((case_) => (
            <div
              key={case_.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedCase(case_)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {case_.title}
                </h3>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${getPriorityColor(case_.priority)}`}></div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(case_.status)}`}>
                    {case_.status}
                  </span>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                Client: {case_.client} • {case_.caseType}
              </p>
              
              <p className="text-sm text-gray-500 mb-3">
                {case_.description}
              </p>
              
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Next deadline: {new Date(case_.nextDeadline).toLocaleDateString()}</span>
                <span>Updated: {new Date(case_.lastUpdated).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              ⏰ Upcoming Deadlines
            </h3>
            <div className="space-y-3">
              {upcomingDeadlines.map((event) => (
                <div key={event.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {event.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(event.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              🚀 Quick Actions
            </h3>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                📝 Create New Case
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                📅 Schedule Court Date
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                📄 Generate Document
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                💰 Log Billable Hours
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Case Detail Modal */}
      {selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {selectedCase.title}
                </h2>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Client
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedCase.client}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Case Type
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedCase.caseType}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </label>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedCase.status)}`}>
                    {selectedCase.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Priority
                  </label>
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${getPriorityColor(selectedCase.priority)} mr-2`}></div>
                    <span className="text-sm text-gray-900 dark:text-white capitalize">{selectedCase.priority}</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <p className="text-sm text-gray-900 dark:text-white">{selectedCase.description}</p>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  Case Timeline
                </h3>
                <div className="space-y-3">
                  {getCaseEvents(selectedCase.id).map((event) => (
                    <div key={event.id} className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-3 h-3 rounded-full mt-1 ${
                        event.completed ? "bg-green-500" : "bg-yellow-500"
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {event.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(event.date).toLocaleDateString()} • {event.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedCase(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Close
                </button>
                <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md">
                  Edit Case
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}