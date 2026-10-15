/**
 * Personal Task Tracker — app.js
 * Beginner-friendly vanilla JavaScript implementation
 */

// ========================================
// DOM Element References
// ========================================
const taskForm = document.getElementById('task-form');
const taskTitleInput = document.getElementById('task-title');
const taskDueDateInput = document.getElementById('task-due-date');
const titleError = document.getElementById('title-error');
const addTaskBtn = document.getElementById('add-task-btn');

const filterAllBtn = document.getElementById('filter-all');
const filterPendingBtn = document.getElementById('filter-pending');
const filterCompletedBtn = document.getElementById('filter-completed');
const filterTabs = document.querySelectorAll('.filter-tab');

const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const emptyMessage = document.getElementById('empty-message');
const taskCount = document.getElementById('task-count');

const storageError = document.getElementById('storage-error');

// ========================================
// Application State
// ========================================
let tasks = [];           // Array of task objects
let currentFilter = 'all'; // 'all', 'pending', 'completed'
let storageAvailable = true; // Track localStorage availability

// ========================================
// SVG Icon for Delete Button
// ========================================
const DELETE_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
`.trim();

// ========================================
// Utility Functions
// ========================================

/**
 * Generate a unique ID using timestamp + random number
 * Simple and sufficient for this app's scale
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * Get current timestamp in ISO format
 */
function getCurrentTimestamp() {
  return new Date().toISOString();
}

/**
 * Check if a date string (YYYY-MM-DD) is in the past
 * Returns true if the date is before today (ignoring time)
 */
function isOverdue(dateString) {
  if (!dateString) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(dateString + 'T00:00:00');
  return dueDate < today;
}

/**
 * Format a date string (YYYY-MM-DD) for display
 * Returns a human-readable string like "Oct 15, 2026"
 */
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Safely set text content of an element
 * Prevents XSS by never using innerHTML with user data
 */
function setTextContent(element, text) {
  if (element) {
    element.textContent = text;
  }
}

/**
 * Show an element by removing the .hidden class
 */
function show(element) {
  if (element) {
    element.classList.remove('hidden');
  }
}

/**
 * Hide an element by adding the .hidden class
 */
function hide(element) {
  if (element) {
    element.classList.add('hidden');
  }
}

// ========================================
// localStorage Functions
// ========================================

/**
 * Check if localStorage is available and working
 * Some browsers disable it in private mode or when storage is full
 */
function checkStorageAvailable() {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    storageAvailable = true;
    hide(storageError);
    return true;
  } catch (e) {
    storageAvailable = false;
    showStorageError('Unable to save tasks. Your browser may be in private mode or storage is full. Tasks will not persist after refresh.');
    return false;
  }
}

/**
 * Display a storage error message to the user
 */
function showStorageError(message) {
  if (storageError) {
    setTextContent(storageError, message);
    show(storageError);
  }
}

/**
 * Save tasks array to localStorage
 * Handles serialization errors gracefully
 */
function saveTasks() {
  if (!storageAvailable) return false;

  try {
    const data = JSON.stringify(tasks);
    localStorage.setItem('tasks', data);
    hide(storageError);
    return true;
  } catch (e) {
    showStorageError('Failed to save tasks. Storage may be full.');
    console.error('Save error:', e);
    return false;
  }
}

/**
 * Load tasks from localStorage
 * Handles missing, corrupted, or invalid data gracefully
 */
function loadTasks() {
  if (!storageAvailable) return [];

  try {
    const data = localStorage.getItem('tasks');
    if (!data) return [];

    const parsed = JSON.parse(data);

    // Validate that we got an array
    if (!Array.isArray(parsed)) {
      throw new Error('Stored data is not an array');
    }

    // Validate each task has required fields
    const validTasks = parsed.filter(task => {
      return task &&
             typeof task.id === 'string' &&
             typeof task.title === 'string' &&
             typeof task.completed === 'boolean' &&
             (task.dueDate === null || typeof task.dueDate === 'string') &&
             typeof task.createdAt === 'string';
    });

    if (validTasks.length !== parsed.length) {
      console.warn('Some stored tasks were invalid and were discarded');
    }

    return validTasks;
  } catch (e) {
    showStorageError('Could not load saved tasks. Starting fresh.');
    console.error('Load error:', e);
    return [];
  }
}

// ========================================
// Task Rendering Functions
// ========================================

/**
 * Create a delete button with SVG icon
 * The CSS expects a .task-delete button containing an <svg>
 */
function createDeleteButton(taskId) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'task-delete';
  button.setAttribute('aria-label', 'Delete task');
  button.innerHTML = DELETE_SVG;

  button.addEventListener('click', () => {
    deleteTask(taskId);
  });

  return button;
}

/**
 * Create a task list item (<li>) element from a task object
 * Uses safe DOM methods — no innerHTML with user content
 */
function createTaskElement(task) {
  const li = document.createElement('li');
  li.className = 'task-item';
  li.dataset.taskId = task.id;

  if (task.completed) {
    li.classList.add('completed');
  }

  // Checkbox
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'task-checkbox';
  checkbox.checked = task.completed;
  checkbox.setAttribute('aria-label', task.completed ? 'Mark as pending' : 'Mark as completed');

  checkbox.addEventListener('change', () => {
    toggleTaskComplete(task.id);
  });

  // Task content container
  const content = document.createElement('div');
  content.className = 'task-content';

  // Task title — using textContent for safety
  const title = document.createElement('h3');
  title.className = 'task-title';
  setTextContent(title, task.title);

  // Task meta (due date)
  const meta = document.createElement('div');
  meta.className = 'task-meta';

  if (task.dueDate) {
    const dueDate = document.createElement('span');
    dueDate.className = 'task-due-date';
    if (!task.completed && isOverdue(task.dueDate)) {
      dueDate.classList.add('overdue');
    }
    setTextContent(dueDate, formatDate(task.dueDate));
    meta.appendChild(dueDate);
  }

  content.appendChild(title);
  content.appendChild(meta);

  // Delete button
  const deleteBtn = createDeleteButton(task.id);

  // Assemble
  li.appendChild(checkbox);
  li.appendChild(content);
  li.appendChild(deleteBtn);

  return li;
}

/**
 * Render all tasks based on current filter
 * Called whenever tasks or filter changes
 */
function renderTasks() {
  // Filter tasks
  let filteredTasks = tasks;
  if (currentFilter === 'pending') {
    filteredTasks = tasks.filter(task => !task.completed);
  } else if (currentFilter === 'completed') {
    filteredTasks = tasks.filter(task => task.completed);
  }

  // Clear the list
  taskList.innerHTML = '';

  // Show/hide empty state
  if (filteredTasks.length === 0) {
    show(emptyState);
    if (tasks.length === 0) {
      setTextContent(emptyMessage, 'No tasks yet. Add one above to get started!');
    } else if (currentFilter === 'pending') {
      setTextContent(emptyMessage, 'No pending tasks. Great job!');
    } else if (currentFilter === 'completed') {
      setTextContent(emptyMessage, 'No completed tasks yet.');
    } else {
      setTextContent(emptyMessage, 'No tasks match this filter.');
    }
  } else {
    hide(emptyState);
    // Add each task to the list
    filteredTasks.forEach(task => {
      const taskElement = createTaskElement(task);
      taskList.appendChild(taskElement);
    });
  }

  // Update task count
  updateTaskCount();
}

/**
 * Update the task count display
 */
function updateTaskCount() {
  const total = tasks.length;
  const pending = tasks.filter(t => !t.completed).length;
  const completed = tasks.filter(t => t.completed).length;

  let countText = '';
  if (currentFilter === 'all') {
    countText = `${total} task${total !== 1 ? 's' : ''} (${pending} pending, ${completed} completed)`;
  } else if (currentFilter === 'pending') {
    countText = `${pending} pending task${pending !== 1 ? 's' : ''}`;
  } else {
    countText = `${completed} completed task${completed !== 1 ? 's' : ''}`;
  }

  setTextContent(taskCount, countText);
}

// ========================================
// Task Operations
// ========================================

/**
 * Add a new task from form input
 */
function addTask(title, dueDate) {
  const task = {
    id: generateId(),
    title: title.trim(),
    dueDate: dueDate || null,
    completed: false,
    createdAt: getCurrentTimestamp()
  };

  tasks.unshift(task); // Add to beginning (newest first)
  saveTasks();
  renderTasks();
}

/**
 * Toggle task completion status
 */
function toggleTaskComplete(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    task.completed = !task.completed;
    saveTasks();
    renderTasks();
  }
}

/**
 * Delete a task with confirmation
 */
function deleteTask(taskId) {
  if (!confirm('Delete this task?')) return;

  tasks = tasks.filter(t => t.id !== taskId);
  saveTasks();
  renderTasks();
}

/**
 * Clear the form and reset validation state
 */
function resetForm() {
  taskForm.reset();
  taskTitleInput.removeAttribute('aria-invalid');
  setTextContent(titleError, '');
  // Set due date to today as default (optional, but user-friendly)
  // taskDueDateInput.valueAsDate = new Date(); // Commented: leave empty by default
}

// ========================================
// Form Validation
// ========================================

/**
 * Validate the task title input
 * Returns true if valid, false otherwise
 */
function validateTitle() {
  const title = taskTitleInput.value.trim();

  if (!title) {
    taskTitleInput.setAttribute('aria-invalid', 'true');
    setTextContent(titleError, 'Task title is required');
    return false;
  }

  if (title.length > 200) {
    taskTitleInput.setAttribute('aria-invalid', 'true');
    setTextContent(titleError, 'Title must be 200 characters or less');
    return false;
  }

  taskTitleInput.removeAttribute('aria-invalid');
  setTextContent(titleError, '');
  return true;
}

// ========================================
// Filter Functions
// ========================================

/**
 * Set the active filter and update UI
 */
function setFilter(filter) {
  currentFilter = filter;

  // Update filter tab states
  filterTabs.forEach(btn => {
    const isActive = btn.dataset.filter === filter;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive);
  });

  renderTasks();
}

// ========================================
// Event Listeners
// ========================================

/**
 * Attach all event listeners
 */
function attachEventListeners() {
  // Form submission
  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!validateTitle()) {
      taskTitleInput.focus();
      return;
    }

    const title = taskTitleInput.value.trim();
    const dueDate = taskDueDateInput.value || null; // Empty string becomes null

    addTask(title, dueDate);
    resetForm();
    taskTitleInput.focus();
  });

  // Real-time validation clearing
  taskTitleInput.addEventListener('input', () => {
    if (taskTitleInput.hasAttribute('aria-invalid')) {
      validateTitle();
    }
  });

  // Filter tabs
  filterAllBtn.addEventListener('click', () => setFilter('all'));
  filterPendingBtn.addEventListener('click', () => setFilter('pending'));
  filterCompletedBtn.addEventListener('click', () => setFilter('completed'));

  // Keyboard navigation for filter tabs (accessibility)
  filterTabs.forEach(btn => {
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setFilter(btn.dataset.filter);
        btn.focus();
      }
    });
  });
}

// ========================================
// Initialization
// ========================================

/**
 * Initialize the application
 */
function init() {
  // Check localStorage availability
  checkStorageAvailable();

  // Load saved tasks
  tasks = loadTasks();

  // Attach event listeners
  attachEventListeners();

  // Initial render
  renderTasks();

  // Focus the title input for immediate use
  taskTitleInput.focus();

  console.log('Personal Task Tracker initialized');
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}