// Notes functionality for side panel

/**
 * Initialize notes functionality
 * @param {Object} params - Parameters for initialization
 * @param {Function} params.onNoteSaved - Callback when a note is saved
 * @returns {Object} - Notes controller methods
 */
export function initNotes({ onNoteSaved }) {
  // DOM elements
  const noteContentInput = document.getElementById('noteContent');
  const saveNoteBtn = document.getElementById('saveNoteBtn');
  const pendingNotesList = document.getElementById('pendingNotes');
  
  // Event listeners
  saveNoteBtn.addEventListener('click', saveNote);
  
  /**
   * Save a new note
   */
  function saveNote() {
    const content = noteContentInput.value.trim();
    
    if (!content) {
      alert('Please enter note content');
      return;
    }
    
    const timestamp = new Date().toISOString();
    
    chrome.storage.local.get(['pendingNotes'], function(result) {
      const pendingNotes = result.pendingNotes || [];
      const newNote = {
        id: Date.now(),
        content: content,
        timestamp: timestamp,
        processed: false
      };
      
      pendingNotes.push(newNote);
      
      chrome.storage.local.set({ pendingNotes: pendingNotes }, function() {
        loadPendingNotes();
        noteContentInput.value = '';
        
        // Trigger sync
        chrome.runtime.sendMessage({ action: 'syncNow' });
        
        // Call saved callback if provided
        if (typeof onNoteSaved === 'function') {
          onNoteSaved(newNote);
        }
      });
    });
  }
  
  /**
   * Load pending notes from storage
   */
  function loadPendingNotes() {
    chrome.storage.local.get(['pendingNotes'], function(result) {
      const pendingNotes = result.pendingNotes || [];
      
      pendingNotesList.innerHTML = '';
      
      if (pendingNotes.length === 0) {
        pendingNotesList.innerHTML = '<li class="empty-message">No pending notes</li>';
        return;
      }
      
      pendingNotes.forEach(note => {
        const li = document.createElement('li');
        const previewContent = note.content.substring(0, 30) + (note.content.length > 30 ? '...' : '');
        
        li.innerHTML = `
          <div class="item-title">${previewContent}</div>
          <div class="item-status">${note.processed ? '<span class="processed">✓</span>' : '<span class="pending">⏱</span>'}</div>
          <div class="item-actions">
            <button class="view-btn" data-id="${note.id}">View</button>
            <button class="delete-btn" data-id="${note.id}">Delete</button>
          </div>
        `;
        pendingNotesList.appendChild(li);
      });
      
      // Add event listeners to buttons
      pendingNotesList.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', viewNote);
      });
      
      pendingNotesList.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', deleteNote);
      });
    });
  }
  
  /**
   * View a note in a modal
   * @param {Event} event - Click event
   */
  function viewNote(event) {
    const noteId = parseInt(event.target.dataset.id);
    
    chrome.storage.local.get(['pendingNotes'], function(result) {
      const pendingNotes = result.pendingNotes || [];
      const note = pendingNotes.find(n => n.id === noteId);
      
      if (note) {
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
          <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h3>Note</h3>
            <div class="note-content">${note.content.replace(/\n/g, '<br>')}</div>
            <div class="note-timestamp">Created: ${new Date(note.timestamp).toLocaleString()}</div>
          </div>
        `;
        document.body.appendChild(modal);
        
        // Add event listeners
        modal.querySelector('.close-modal').addEventListener('click', () => {
          document.body.removeChild(modal);
        });
        
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            document.body.removeChild(modal);
          }
        });
      }
    });
  }
  
  /**
   * Delete a note
   * @param {Event} event - Click event
   */
  function deleteNote(event) {
    const noteId = parseInt(event.target.dataset.id);
    
    if (confirm('Are you sure you want to delete this note?')) {
      chrome.storage.local.get(['pendingNotes'], function(result) {
        const pendingNotes = result.pendingNotes || [];
        const updatedNotes = pendingNotes.filter(n => n.id !== noteId);
        
        chrome.storage.local.set({ pendingNotes: updatedNotes }, function() {
          loadPendingNotes();
        });
      });
    }
  }
  
  /**
   * Edit an existing note
   * @param {number} noteId - ID of the note to edit
   * @param {string} newContent - New content for the note
   */
  function editNote(noteId, newContent) {
    if (!newContent.trim()) {
      alert('Note content cannot be empty');
      return;
    }
    
    chrome.storage.local.get(['pendingNotes'], function(result) {
      const pendingNotes = result.pendingNotes || [];
      const noteIndex = pendingNotes.findIndex(n => n.id === noteId);
      
      if (noteIndex !== -1) {
        // Update the note
        pendingNotes[noteIndex] = {
          ...pendingNotes[noteIndex],
          content: newContent,
          timestamp: new Date().toISOString(),
          processed: false
        };
        
        chrome.storage.local.set({ pendingNotes: pendingNotes }, function() {
          loadPendingNotes();
          
          // Trigger sync
          chrome.runtime.sendMessage({ action: 'syncNow' });
        });
      }
    });
  }
  
  // Return public methods
  return {
    loadPendingNotes,
    saveNote,
    editNote
  };
}
