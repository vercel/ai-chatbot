"use client";

import { useState } from "react";

interface ClientPortalProps {
  userId: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  status: "active" | "inactive" | "prospective";
  cases: string[];
  totalBilled: number;
  lastContact: string;
  notes: string;
}

interface ClientMessage {
  id: string;
  clientId: string;
  from: "client" | "lawyer";
  message: string;
  timestamp: string;
  read: boolean;
  attachments?: string[];
}

export function ClientPortal({ userId }: ClientPortalProps) {
  const [clients, setClients] = useState<Client[]>([
    {
      id: "1",
      name: "John Smith",
      email: "john.smith@email.com",
      phone: "(555) 123-4567",
      company: "Smith Enterprises",
      status: "active",
      cases: ["Smith vs. ABC Corp - Employment Dispute"],
      totalBilled: 15750.00,
      lastContact: "2024-01-28",
      notes: "Prefers email communication. Available for calls after 2 PM."
    },
    {
      id: "2",
      name: "Sarah Johnson",
      email: "sarah.j@email.com",
      phone: "(555) 987-6543",
      status: "active",
      cases: ["Johnson Contract Review"],
      totalBilled: 3200.00,
      lastContact: "2024-01-25",
      notes: "New client. Referred by existing client Robert Williams."
    },
    {
      id: "3",
      name: "Robert Williams",
      email: "r.williams@email.com",
      phone: "(555) 456-7890",
      status: "active",
      cases: ["Estate Planning - Williams Family"],
      totalBilled: 8900.00,
      lastContact: "2024-01-20",
      notes: "Long-term client. Family estate planning and business law matters."
    }
  ]);

  const [messages, setMessages] = useState<ClientMessage[]>([
    {
      id: "1",
      clientId: "1",
      from: "client",
      message: "Hi, I wanted to follow up on the discovery deadline we discussed. Do you need any additional documents from me?",
      timestamp: "2024-01-28T10:30:00Z",
      read: true
    },
    {
      id: "2",
      clientId: "1",
      from: "lawyer",
      message: "Thanks for reaching out. We have everything we need for now. I'll send you a summary of our strategy by end of week.",
      timestamp: "2024-01-28T14:15:00Z",
      read: true
    },
    {
      id: "3",
      clientId: "2",
      from: "client",
      message: "I reviewed the contract terms you sent. I have a few questions about the termination clause. Can we schedule a call?",
      timestamp: "2024-01-27T16:45:00Z",
      read: false
    }
  ]);

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showMessages, setShowMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "inactive": return "bg-gray-100 text-gray-800";
      case "prospective": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getClientMessages = (clientId: string) => {
    return messages.filter(msg => msg.clientId === clientId);
  };

  const unreadMessages = messages.filter(msg => !msg.read && msg.from === "client");

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedClient) return;

    const message: ClientMessage = {
      id: Date.now().toString(),
      clientId: selectedClient.id,
      from: "lawyer",
      message: newMessage,
      timestamp: new Date().toISOString(),
      read: true
    };

    setMessages(prev => [...prev, message]);
    setNewMessage("");
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {clients.filter(c => c.status === "active").length}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Clients</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {unreadMessages.length}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Unread Messages</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  ${(clients.reduce((sum, c) => sum + c.totalBilled, 0) / 1000).toFixed(0)}K
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Billed</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <button
            onClick={() => setShowMessages(!showMessages)}
            className="w-full h-full flex items-center justify-center text-blue-600 hover:text-blue-800 font-medium"
          >
            💬 Messages
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold">👥 Client Directory</h2>
          
          {clients.map((client) => (
            <div
              key={client.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedClient(client)}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {client.name}
                  </h3>
                  {client.company && (
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {client.company}
                    </p>
                  )}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                  {client.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300 mb-3">
                <div>
                  <span className="font-medium">Email:</span> {client.email}
                </div>
                <div>
                  <span className="font-medium">Phone:</span> {client.phone}
                </div>
              </div>
              
              <div className="mb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Cases:</span>
                <ul className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {client.cases.map((case_, index) => (
                    <li key={index} className="truncate">• {case_}</li>
                  ))}
                </ul>
              </div>
              
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Total Billed: ${client.totalBilled.toLocaleString()}</span>
                <span>Last Contact: {new Date(client.lastContact).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Messages */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              💬 Recent Messages
            </h3>
            <div className="space-y-3">
              {unreadMessages.slice(0, 3).map((message) => {
                const client = clients.find(c => c.id === message.clientId);
                return (
                  <div key={message.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {client?.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {message.message}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(message.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              🚀 Quick Actions
            </h3>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                👤 Add New Client
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                📧 Send Update Email
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                📅 Schedule Meeting
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                💰 Generate Invoice
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Client Detail Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {selectedClient.name}
                  </h2>
                  {selectedClient.company && (
                    <p className="text-gray-600 dark:text-gray-300">{selectedClient.company}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Client Info */}
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">Contact Information</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Email:</span> {selectedClient.email}
                    </div>
                    <div>
                      <span className="font-medium">Phone:</span> {selectedClient.phone}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(selectedClient.status)}`}>
                        {selectedClient.status}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-medium text-gray-900 dark:text-white mt-6 mb-3">Notes</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded">
                    {selectedClient.notes}
                  </p>
                </div>

                {/* Messages */}
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">Messages</h3>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="h-64 overflow-y-auto p-3 space-y-3">
                      {getClientMessages(selectedClient.id).map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.from === "lawyer" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                              message.from === "lawyer"
                                ? "bg-blue-500 text-white"
                                : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                            }`}
                          >
                            <p>{message.message}</p>
                            <p className={`text-xs mt-1 ${
                              message.from === "lawyer" ? "text-blue-100" : "text-gray-500"
                            }`}>
                              {new Date(message.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 p-3">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                        />
                        <button
                          onClick={sendMessage}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedClient(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Close
                </button>
                <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md">
                  Edit Client
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}