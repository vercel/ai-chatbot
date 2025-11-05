"use client";

import { useState } from "react";

interface BillingTrackerProps {
  userId: string;
}

interface TimeEntry {
  id: string;
  date: string;
  client: string;
  case: string;
  description: string;
  hours: number;
  rate: number;
  total: number;
  billable: boolean;
  billed: boolean;
}

interface Invoice {
  id: string;
  client: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  status: "draft" | "sent" | "paid" | "overdue";
  subtotal: number;
  tax: number;
  total: number;
  timeEntries: string[];
}

export function BillingTracker({ userId }: BillingTrackerProps) {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([
    {
      id: "1",
      date: "2024-01-28",
      client: "John Smith",
      case: "Smith vs. ABC Corp",
      description: "Review discovery documents and prepare response strategy",
      hours: 3.5,
      rate: 450,
      total: 1575,
      billable: true,
      billed: false
    },
    {
      id: "2",
      date: "2024-01-27",
      client: "Sarah Johnson",
      case: "Johnson Contract Review",
      description: "Contract analysis and risk assessment",
      hours: 2.0,
      rate: 400,
      total: 800,
      billable: true,
      billed: false
    },
    {
      id: "3",
      date: "2024-01-26",
      client: "John Smith",
      case: "Smith vs. ABC Corp",
      description: "Client meeting and case strategy discussion",
      hours: 1.5,
      rate: 450,
      total: 675,
      billable: true,
      billed: true
    },
    {
      id: "4",
      date: "2024-01-25",
      client: "Robert Williams",
      case: "Estate Planning",
      description: "Draft will and trust documents",
      hours: 4.0,
      rate: 350,
      total: 1400,
      billable: true,
      billed: true
    }
  ]);

  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: "1",
      client: "John Smith",
      invoiceNumber: "INV-2024-001",
      date: "2024-01-20",
      dueDate: "2024-02-20",
      status: "sent",
      subtotal: 2250,
      tax: 225,
      total: 2475,
      timeEntries: ["3"]
    },
    {
      id: "2",
      client: "Robert Williams",
      invoiceNumber: "INV-2024-002",
      date: "2024-01-25",
      dueDate: "2024-02-25",
      status: "paid",
      subtotal: 1400,
      tax: 140,
      total: 1540,
      timeEntries: ["4"]
    }
  ]);

  const [showNewTimeEntry, setShowNewTimeEntry] = useState(false);
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    client: "",
    case: "",
    description: "",
    hours: 0,
    rate: 400
  });

  const unbilledEntries = timeEntries.filter(entry => entry.billable && !entry.billed);
  const totalUnbilled = unbilledEntries.reduce((sum, entry) => sum + entry.total, 0);
  const totalBilled = timeEntries.filter(entry => entry.billed).reduce((sum, entry) => sum + entry.total, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-gray-100 text-gray-800";
      case "sent": return "bg-blue-100 text-blue-800";
      case "paid": return "bg-green-100 text-green-800";
      case "overdue": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const addTimeEntry = () => {
    if (!newEntry.client || !newEntry.description || newEntry.hours <= 0) return;

    const entry: TimeEntry = {
      id: Date.now().toString(),
      date: newEntry.date,
      client: newEntry.client,
      case: newEntry.case,
      description: newEntry.description,
      hours: newEntry.hours,
      rate: newEntry.rate,
      total: newEntry.hours * newEntry.rate,
      billable: true,
      billed: false
    };

    setTimeEntries(prev => [entry, ...prev]);
    setNewEntry({
      date: new Date().toISOString().split('T')[0],
      client: "",
      case: "",
      description: "",
      hours: 0,
      rate: 400
    });
    setShowNewTimeEntry(false);
  };

  const generateInvoice = () => {
    if (unbilledEntries.length === 0) return;

    // Group by client
    const clientGroups = unbilledEntries.reduce((groups, entry) => {
      if (!groups[entry.client]) {
        groups[entry.client] = [];
      }
      groups[entry.client].push(entry);
      return groups;
    }, {} as Record<string, TimeEntry[]>);

    // Create invoices for each client
    Object.entries(clientGroups).forEach(([client, entries]) => {
      const subtotal = entries.reduce((sum, entry) => sum + entry.total, 0);
      const tax = subtotal * 0.1; // 10% tax
      const total = subtotal + tax;

      const invoice: Invoice = {
        id: Date.now().toString(),
        client: client,
        invoiceNumber: `INV-2024-${String(invoices.length + 1).padStart(3, '0')}`,
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: "draft",
        subtotal: subtotal,
        tax: tax,
        total: total,
        timeEntries: entries.map(e => e.id)
      };

      setInvoices(prev => [invoice, ...prev]);

      // Mark entries as billed
      setTimeEntries(prev => prev.map(entry => 
        entries.some(e => e.id === entry.id) 
          ? { ...entry, billed: true }
          : entry
      ));
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">$</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Unbilled</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                ${totalUnbilled.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">$</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Billed</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                ${totalBilled.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {unbilledEntries.length}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Unbilled Entries</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <button
            onClick={() => setShowNewTimeEntry(true)}
            className="w-full h-full flex items-center justify-center text-blue-600 hover:text-blue-800 font-medium"
          >
            + Log Time
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Time Entries */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">⏰ Time Entries</h2>
            <button
              onClick={generateInvoice}
              disabled={unbilledEntries.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generate Invoice
            </button>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Client/Case
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {timeEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {new Date(entry.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        <div>
                          <div className="font-medium">{entry.client}</div>
                          <div className="text-gray-500">{entry.case}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {entry.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {entry.hours}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        ${entry.rate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        ${entry.total.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          entry.billed 
                            ? "bg-green-100 text-green-800" 
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {entry.billed ? "Billed" : "Unbilled"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Invoices Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              📄 Recent Invoices
            </h3>
            <div className="space-y-3">
              {invoices.slice(0, 5).map((invoice) => (
                <div key={invoice.id} className="border border-gray-200 dark:border-gray-700 rounded p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {invoice.invoiceNumber}
                      </p>
                      <p className="text-xs text-gray-500">{invoice.client}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      ${invoice.total.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500">
                      Due: {new Date(invoice.dueDate).toLocaleDateString()}
                    </span>
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
              <button 
                onClick={() => setShowNewTimeEntry(true)}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                ⏰ Log Time Entry
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                📄 Create Invoice
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                📊 View Reports
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                💳 Process Payment
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* New Time Entry Modal */}
      {showNewTimeEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Log Time Entry
                </h3>
                <button
                  onClick={() => setShowNewTimeEntry(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newEntry.date}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Client
                  </label>
                  <input
                    type="text"
                    value={newEntry.client}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, client: e.target.value }))}
                    placeholder="Client name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Case
                  </label>
                  <input
                    type="text"
                    value={newEntry.case}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, case: e.target.value }))}
                    placeholder="Case name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newEntry.description}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Work description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Hours
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      value={newEntry.hours}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, hours: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Rate ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newEntry.rate}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Total: <span className="font-medium">${(newEntry.hours * newEntry.rate).toFixed(2)}</span>
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowNewTimeEntry(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={addTimeEntry}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  Log Time
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}