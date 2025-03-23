/**
 * Global debug helpers for the UI
 * This script adds utility functions to the window object to help debug the UI
 */

// Create task management debug data
window.setupTaskMockData = () => {
  // Default projects
  const projects = [
    {
      id: 'p1',
      name: 'Inbox',
      color: '#3B82F6',
      isDefault: true,
      isDeleted: false,
      userId: 'user1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'p2',
      name: 'Personal',
      color: '#10B981',
      isDefault: false,
      isDeleted: false,
      userId: 'user1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'p3',
      name: 'Work',
      color: '#F59E0B',
      isDefault: false,
      isDeleted: false,
      userId: 'user1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  
  // Default tasks
  const tasks = [
    {
      id: 't1',
      content: 'Fix UI layout issues',
      description: 'Address sidebar and content width problems',
      priority: 'p1',
      projectId: 'p1',
      completed: false,
      isDeleted: false,
      userId: 'user1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 't2',
      content: 'Implement task management features',
      description: 'Complete the core functionality',
      priority: 'p2',
      projectId: 'p2',
      completed: false,
      isDeleted: false,
      userId: 'user1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 't3',
      content: 'Fix API errors',
      description: 'Address the errors displayed in the browser console',
      priority: 'p1',
      projectId: 'p3',
      completed: false,
      isDeleted: false,
      userId: 'user1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 't4',
      content: 'Update component styles',
      description: 'Make UI look more consistent',
      priority: 'p3',
      projectId: 'p1',
      completed: true,
      isDeleted: false,
      userId: 'user1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  
  // Save to localStorage
  localStorage.setItem('debug_taskProjects', JSON.stringify(projects));
  localStorage.setItem('debug_taskItems', JSON.stringify(tasks));
  
  console.log('Task management debug data created:', { projects, tasks });
  
  // Reload the page to apply changes
  window.location.reload();
};

// Create extension debug data
window.setupExtensionMockData = () => {
  const mockFiles = [
    { id: 'f1', name: 'Recording 1.mp3', type: 'audio', size: '2.3 MB', status: 'ready' },
    { id: 'f2', name: 'Notes from meeting.txt', type: 'text', size: '4.1 KB', status: 'ready' },
    { id: 'f3', name: 'Quick note.txt', type: 'note', size: '1.5 KB', status: 'ready' }
  ];
  
  const mockOfflineFiles = [
    { id: 'of1', name: 'Offline recording.webm', type: 'audio', size: '3.7 MB', timestamp: new Date().toISOString() },
    { id: 'of2', name: 'Offline note.txt', type: 'text', size: '2.9 KB', timestamp: new Date().toISOString() }
  ];
  
  localStorage.setItem('extension_unprocessed_files', JSON.stringify(mockFiles));
  localStorage.setItem('extension_offline_files', JSON.stringify(mockOfflineFiles));
  
  console.log('Extension debug data created:', { mockFiles, mockOfflineFiles });
  
  // Reload the page to apply changes
  window.location.reload();
};

// Clear all debug data
window.clearDebugData = () => {
  // Task management
  localStorage.removeItem('debug_taskProjects');
  localStorage.removeItem('debug_taskItems');
  
  // Extension
  localStorage.removeItem('extension_unprocessed_files');
  localStorage.removeItem('extension_offline_files');
  
  console.log('All debug data cleared');
  
  // Reload the page to apply changes
  window.location.reload();
};

// Create default debug data if none exists
(function initializeDebugData() {
  // Check if task data exists
  if (!localStorage.getItem('debug_taskProjects')) {
    console.log('No task management debug data found. Creating default data...');
    window.setupTaskMockData();
  }
  
  // Check if extension data exists
  if (!localStorage.getItem('extension_unprocessed_files')) {
    console.log('No extension debug data found. Creating default data...');
    window.setupExtensionMockData();
  }
  
  console.log('Debug helpers loaded. Available commands:');
  console.log('- window.setupTaskMockData(): Create task management debug data');
  console.log('- window.setupExtensionMockData(): Create extension debug data');
  console.log('- window.clearDebugData(): Clear all debug data');
})();
