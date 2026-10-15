# Learning Log

A session-by-session record of work completed, concepts learned, errors encountered, and next steps.

---

## Entry Template

Copy this template for each new entry:

```markdown
## YYYY-MM-DD — Project Name / Task

**Task Completed:**
- Brief description of what was built or accomplished

**Concepts Learned:**
- Concept 1 — brief explanation
- Concept 2 — brief explanation

**Errors & Fixes:**
- **Error:** What went wrong
- **Fix:** How it was resolved
- **Lesson:** What to remember next time

**Next Steps:**
- [ ] Specific action item
- [ ] Another action item

---

```

---

## Entries

## 2026-10-15 — Personal Task Tracker (Project 1) / Complete v1 Implementation

**Task Completed:**
- Built a complete, working Personal Task Tracker web app with plain HTML, CSS, and JavaScript
- Implemented all core features: add tasks (title + optional due date), toggle completion, delete with confirmation, filter by All/Pending/Completed
- Added localStorage persistence so tasks survive page refresh and browser restart
- Created responsive, accessible UI with clean design
- Wrote project documentation (README.md)

**Concepts Learned:**
- Semantic HTML structure with proper ARIA attributes for accessibility (role="tab", aria-selected, aria-live, aria-invalid)
- CSS custom properties (design tokens) for consistent colors, spacing, shadows, and easy theming
- Flexbox layouts for panels, form groups, filter tabs, and task rows
- Responsive design with @media breakpoints and CSS variable overrides
- Vanilla JavaScript DOM manipulation: createElement, appendChild, textContent for safe rendering
- Event delegation vs. direct listeners — used direct listeners for simplicity at this scale
- localStorage API: setItem, getItem, JSON.stringify/parse, and error handling for private mode/quota
- XSS prevention: never using innerHTML with user data, always using textContent
- Unique ID generation using timestamp + random string (no external library needed)
- Form validation with aria-invalid and live error messages
- Keyboard accessibility: focus-visible styles, Enter/Space activation on filter tabs
- Print stylesheet for clean task list printing

**Errors & Fixes:**
- **Error:** localStorage unavailable in private/incognito mode caused crashes
  - **Fix:** Added checkStorageAvailable() that tests localStorage with try/catch, sets a flag, and shows a user-friendly error banner instead of crashing
  - **Lesson:** Always feature-detect browser APIs before relying on them
- **Error:** Corrupted or invalid JSON in localStorage broke app initialization
  - **Fix:** Wrapped loadTasks() in try/catch, validate parsed data is an array with correct task structure, discard invalid entries
  - **Lesson:** Never trust persisted data — always validate on read
- **Error:** CSS expected an SVG inside .task-delete button but HTML had none
  - **Fix:** Defined DELETE_SVG constant in JS and inject it via innerHTML when creating delete buttons (safe because SVG is static)
  - **Lesson:** Document CSS/JS contracts explicitly; the review step caught this
- **Error:** Filter tab active state not updating aria-selected
  - **Fix:** Added setAttribute('aria-selected', isActive) in setFilter()
  - **Lesson:** Visual state and accessibility state must stay in sync

**Next Steps:**
- [ ] Stage 02: AI Tool — integrate an LLM API to add AI-powered features (summarization, suggestions)
- [ ] Add learning log entries for each future session
- [ ] Update PROJECT_TRACKER.md when stages change status

---

*(First entry will go here)*