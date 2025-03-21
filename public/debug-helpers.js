// Debug helper functions for development

/**
 * This function adds mock data to localStorage to help debug the Extension page
 */
function setupExtensionMockData() {
  // Mock unprocessed files for extension status panel
  const unprocessedFiles = [
    {
      name: "Meeting recording.m4a",
      path: "/downloads/meeting-recording.m4a",
      type: "recording",
      timestamp: new Date().toISOString()
    },
    {
      name: "Notes from call.txt",
      path: "/downloads/notes-from-call.txt",
      type: "text",
      timestamp: new Date(Date.now() - 3600000).toISOString()
    },
    {
      name: "Quick thought.txt",
      path: "/downloads/quick-thought.txt",
      type: "note",
      timestamp: new Date(Date.now() - 7200000).toISOString()
    }
  ];

  // Mock offline files
  const offlineFiles = [
    {
      id: "1",
      name: "Weekly meeting.m4a",
      path: "/offline/weekly-meeting.m4a",
      type: "recording",
      timestamp: new Date().toISOString(),
      processed: true,
      error: null,
      processingTimestamp: new Date().toISOString()
    },
    {
      id: "2",
      name: "Research notes.txt",
      path: "/offline/research-notes.txt",
      type: "text",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      processed: false,
      error: null,
      processingTimestamp: null
    },
    {
      id: "3",
      name: "Failed recording.m4a",
      path: "/offline/failed-recording.m4a",
      type: "recording",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      processed: false,
      error: "File format not supported",
      processingTimestamp: new Date(Date.now() - 6000000).toISOString()
    }
  ];

  // Store in localStorage
  localStorage.setItem('debug_unprocessedFiles', JSON.stringify(unprocessedFiles));
  localStorage.setItem('debug_offlineFiles', JSON.stringify(offlineFiles));
  
  console.log('Extension mock data initialized');
  alert('Extension mock data initialized! Refresh the page to see it.');
}

/**
 * This function adds mock data to localStorage to help debug the Task Management page
 */
function setupTaskMockData() {
  // Mock projects
  const projects = [
    {
      id: "p1",
      name: "Inbox",
      color: "#3B82F6", // Blue
      isDefault: true,
      userId: "current-user",
      isDeleted: false,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "p2",
      name: "Work",
      color: "#EF4444", // Red
      isDefault: false,
      userId: "current-user",
      isDeleted: false,
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "p3",
      name: "Personal",
      color: "#10B981", // Green
      isDefault: false,
      userId: "current-user",
      isDeleted: false,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  // Mock tasks
  const tasks = [
    {
      id: "t1",
      name: "Complete project proposal",
      description: "Finalize the Q2 project proposal for client review",
      completed: false,
      priority: "p1",
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      projectId: "p2",
      userId: "current-user",
      isDeleted: false,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "t2",
      name: "Grocery shopping",
      description: "Buy groceries for the week",
      completed: true,
      priority: "p2",
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      projectId: "p3",
      userId: "current-user",
      isDeleted: false,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "t3",
      name: "Schedule doctor appointment",
      description: "Annual checkup",
      completed: false,
      priority: "p3",
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      projectId: "p3",
      userId: "current-user",
      isDeleted: false,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "t4",
      name: "Review marketing materials",
      description: "Look over the new brochures and website copy",
      completed: false,
      priority: "p2",
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      projectId: "p2",
      userId: "current-user",
      isDeleted: false,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "t5",
      name: "Prepare presentation",
      description: "Create slides for the team meeting",
      completed: false,
      priority: "p1",
      dueDate: null,
      projectId: "p1",
      userId: "current-user",
      isDeleted: false,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  // Store in localStorage
  localStorage.setItem('debug_taskProjects', JSON.stringify(projects));
  localStorage.setItem('debug_taskItems', JSON.stringify(tasks));
  
  console.log('Task Management mock data initialized');
  alert('Task Management mock data initialized! Refresh the page to see it.');
}

// Make functions available globally
window.setupExtensionMockData = setupExtensionMockData;
window.setupTaskMockData = setupTaskMockData;

// Show a message in the console
console.log('Debug helpers loaded. Use the following functions to initialize mock data:');
console.log('1. window.setupExtensionMockData() - to add mock data for Extension page');
console.log('2. window.setupTaskMockData() - to add mock data for Task Management page');
