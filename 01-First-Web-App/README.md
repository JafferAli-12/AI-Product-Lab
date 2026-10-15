# Personal Task Tracker — Project 1

A simple, browser-based task management app built with plain HTML, CSS, and JavaScript. This is the first project in the AI-Product-Lab learning series.

## What It Does

The Personal Task Tracker lets you:
- Add tasks with a title and optional due date
- Mark tasks as complete or reopen them
- Filter tasks by All, Pending, or Completed
- Delete tasks with confirmation
- Have your tasks persist automatically in the browser (localStorage)

No installation, no server, no accounts — just open `index.html` in a browser and start using it.

## Features

| Feature | Description |
|---------|-------------|
| **Add tasks** | Title (required, max 200 chars) + optional due date |
| **Complete/reopen** | Click the checkbox to toggle status |
| **Filter** | Three tabs: All / Pending / Completed |
| **Delete** | Trash button with confirmation prompt |
| **Overdue highlighting** | Past-due incomplete tasks show in red |
| **Task count** | Shows total/pending/completed based on filter |
| **Empty states** | Helpful messages when no tasks match |
| **Persistence** | Tasks saved to localStorage automatically |
| **Responsive** | Works on desktop and mobile |
| **Accessible** | Keyboard navigation, ARIA labels, focus indicators |

## Project Files

```
01-First-Web-App/
├── index.html    # Structure, semantic HTML, accessibility attributes
├── style.css     # All styling: layout, colors, responsive, print styles
├── app.js        # Application logic: tasks, filters, localStorage, rendering
└── README.md     # This file
```

### Responsibilities

| File | Responsibility |
|------|----------------|
| `index.html` | Page structure, form, filter tabs, task list container, empty state, error banner. Links CSS and JS. |
| `style.css` | Design tokens (colors, spacing), panel layout, form styling, filter tabs, task rows, empty/error states, responsive breakpoints, print styles. |
| `app.js` | Task CRUD, filter logic, safe DOM rendering, localStorage save/load with error handling, validation, event listeners, initialization. |

## How to Run (Windows)

1. Open File Explorer and navigate to:
   ```
   C:\Users\jaffe\OneDrive\Documents\AI-Product-Lab\01-First-Web-App
   ```

2. Double-click `index.html` — it opens in your default browser.

   Or from PowerShell:
   ```powershell
   cd C:\Users\jaffe\OneDrive\Documents\AI-Product-Lab\01-First-Web-App
   start index.html
   ```

3. The app loads immediately. No build step, no server required.

## How Persistence Works

- Tasks are saved to **localStorage** under the key `"tasks"`.
- Data is stored as a JSON array of task objects.
- On every change (add, toggle, delete), the entire array is re-serialized and saved.
- On page load, the app reads and parses the stored data.

### Task Data Structure

```json
{
  "id": "abc123def456",           // Unique identifier
  "title": "Buy groceries",       // User-entered title
  "dueDate": "2026-10-20",        // YYYY-MM-DD or null
  "completed": false,             // Boolean
  "createdAt": "2026-10-15T..."   // ISO timestamp
}
```

### localStorage Limitations

| Limitation | Impact |
|------------|--------|
| **5–10 MB quota** | Plenty for thousands of tasks |
| **Same-origin only** | Tied to the file:// origin or domain — won't sync across devices or browsers |
| **No query API** | Must load all tasks, filter in JavaScript |
| **Synchronous** | Blocks main thread briefly (negligible here) |
| **User can clear it** | Browser "Clear browsing data" wipes tasks |
| **No expiration** | Data persists until explicitly removed |
| **Not secure** | Never store passwords, tokens, or sensitive data here |

**For v1 this is perfect.** Future projects will introduce a real backend.

## Manual Testing Checklist

| Test | Expected Result |
|------|-----------------|
| Open `index.html` | App loads, shows empty state "No tasks yet..." |
| Add task with title only | Task appears at top of list, count updates |
| Add task with due date | Task shows formatted date (e.g., "Oct 20, 2026") |
| Add task with past due date | Task shows red overdue badge |
| Add task with empty title | Inline error "Task title is required", input highlighted red |
| Add task with >200 char title | Inline error "Title must be 200 characters or less" |
| Click checkbox on pending task | Task moves to Completed filter, strikethrough style |
| Click checkbox on completed task | Task moves back to Pending, strikethrough removed |
| Click filter tabs (All/Pending/Completed) | Active tab highlighted, list updates, count updates |
| Click delete button | Confirm dialog appears; on confirm, task removed |
| Refresh page (F5) | All tasks persist, filter state resets to All |
| Close and reopen browser | Tasks still present |
| Resize window to mobile width | Layout stacks, filter tabs wrap, touch targets enlarge |
| Tab through form and filters | Focus indicators visible, logical tab order |
| Open in private/incognito mode | Storage error banner appears, tasks don't persist |

---

## Learning Context

This project is **Stage 01** of the AI-Product-Lab roadmap. It teaches:
- Semantic HTML and accessibility basics
- CSS custom properties, flexbox, responsive design
- Vanilla JavaScript: DOM manipulation, event handling, localStorage
- Safe rendering practices (XSS prevention)
- Graceful error handling for browser APIs

See the main [AI-Product-Lab README](../README.md) for the full roadmap.