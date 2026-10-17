/**
 * AI Text Assistant — app.js
 * Beginner-friendly vanilla JavaScript frontend.
 *
 * This version IS connected to the backend: it sends the chosen action and
 * the user's text to POST /api/process and shows Gemini's reply.
 *
 * The API key is NEVER handled here. It lives only on the Python server.
 */

// ========================================
// DOM Element References
// Caching elements once avoids repeated lookups.
// ========================================
const inputText = document.getElementById('input-text');
const charCounter = document.getElementById('char-counter');
const inputError = document.getElementById('input-error');
const runActionBtn = document.getElementById('run-action-btn');

const selectedActionLabel = document.getElementById('selected-action-label');
const actionTabs = document.querySelectorAll('.action-tab');

const resultEmpty = document.getElementById('result-empty');
const resultEmptyMessage = document.getElementById('result-empty-message');
const resultOutput = document.getElementById('result-output');

// ========================================
// Application State
// ========================================

// Which action is currently selected. Starts empty so the user
// must consciously pick one before running.
let selectedAction = null;

// True while a request is in flight. Used to block duplicate submissions
// (e.g. someone clicking "Run Action" twice quickly).
let isLoading = false;

// A small lookup table that maps an action key to a friendly label.
const ACTION_LABELS = {
  summarize: 'Summarize',
  rewrite: 'Rewrite Professionally',
  explain: 'Explain Simply'
};

// Colors for the error notice. Kept here in JS so we do NOT have to change
// style.css — the .result-notice class already gives us the box shape.
const ERROR_BOX_COLORS = {
  background: '#fef2f2',
  border: '#fecaca',
  color: '#991b1b'
};

// ========================================
// Small helper functions
// ========================================

/** Show an element by removing the .hidden class. */
function show(element) {
  if (element) element.classList.remove('hidden');
}

/** Hide an element by adding the .hidden class. */
function hide(element) {
  if (element) element.classList.add('hidden');
}

/**
 * Safely set the text inside an element.
 * Using textContent (not innerHTML) means any text — including text the
 * user typed OR text the AI returned — is treated as plain text. It can
 * never be run as HTML or script. This is our XSS protection.
 */
function setText(element, text) {
  if (element) element.textContent = text;
}

// ========================================
// Action selection
// ========================================

/**
 * Mark one action tab as active and remember the choice.
 * We update BOTH the visual state (.active class) and the
 * accessibility state (aria-selected) so they never disagree.
 */
function selectAction(action) {
  selectedAction = action;

  actionTabs.forEach((tab) => {
    const isActive = tab.dataset.action === action;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  // Update the "Selected action: ..." indicator.
  setText(selectedActionLabel, ACTION_LABELS[action] || 'None');

  // Clear any previous "no action selected" error.
  clearError();
}

// ========================================
// Character counter
// ========================================

/**
 * Update the "0 / 5000" counter and warn when the user
 * gets close to the maximum length.
 */
function updateCharCounter() {
  const length = inputText.value.length;
  const max = inputText.maxLength; // 5000, read from the HTML
  setText(charCounter, `${length} / ${max}`);

  // Turn the counter red when 90% or more of the limit is used.
  const nearLimit = length >= max * 0.9;
  charCounter.classList.toggle('near-limit', nearLimit);
}

// ========================================
// Validation and error messages
// ========================================

/** Show a validation/error message under the textarea. */
function showError(message) {
  setText(inputError, message);
  inputText.setAttribute('aria-invalid', 'true');
}

/** Clear the error message and the invalid styling. */
function clearError() {
  setText(inputError, '');
  inputText.removeAttribute('aria-invalid');
}

/**
 * Check the form before running an action.
 * Returns true when it is safe to send the request.
 */
function validateInput() {
  const text = inputText.value.trim();

  if (!selectedAction) {
    showError('Please choose an action first.');
    inputText.focus();
    return false;
  }

  if (!text) {
    showError('Please enter some text before running an action.');
    inputText.focus();
    return false;
  }

  clearError();
  return true;
}

// ========================================
// Result rendering (all use safe DOM methods)
// ========================================

/** Show a neutral "working" placeholder in the result area. */
function renderLoading() {
  resultOutput.textContent = '';

  const box = document.createElement('div');
  box.className = 'result-notice';
  setText(box, 'Working… asking Gemini for a result. Please wait.');

  resultOutput.appendChild(box);

  hide(resultEmpty);
  show(resultOutput);
}

/** Show a successful AI result. */
function renderResult(actionKey, text) {
  resultOutput.textContent = '';

  // Small uppercase label naming which action produced this result.
  const label = document.createElement('span');
  label.className = 'result-action-label';
  setText(label, ACTION_LABELS[actionKey] || 'Result');

  // The result itself — plain text, never HTML.
  const body = document.createElement('div');
  setText(body, text);

  resultOutput.appendChild(label);
  resultOutput.appendChild(body);

  hide(resultEmpty);
  show(resultOutput);
}

/** Show a user-friendly error box in the result area. */
function renderError(message) {
  resultOutput.textContent = '';

  const box = document.createElement('div');
  box.className = 'result-notice';
  // Reuse the notice shape but switch it to an error (red) palette.
  box.style.backgroundColor = ERROR_BOX_COLORS.background;
  box.style.borderColor = ERROR_BOX_COLORS.border;
  box.style.color = ERROR_BOX_COLORS.color;

  const title = document.createElement('strong');
  setText(title, 'Something went wrong');

  const body = document.createElement('p');
  body.style.margin = '0';
  setText(body, message);

  box.appendChild(title);
  box.appendChild(body);

  resultOutput.appendChild(box);

  hide(resultEmpty);
  show(resultOutput);
}

// ========================================
// Loading state (blocks duplicate submissions)
// ========================================

/** Turn the loading state on or off and update the button. */
function setLoading(loading) {
  isLoading = loading;
  runActionBtn.disabled = loading;
  runActionBtn.textContent = loading ? 'Working…' : 'Run Action';
  runActionBtn.setAttribute('aria-busy', loading ? 'true' : 'false');
}

// ========================================
// Running an action
// ========================================

/**
 * Handle the "Run Action" button:
 *  1. Validate locally.
 *  2. Send the action + text to the backend.
 *  3. Show the result, or a helpful error message.
 *  4. Always restore the interface afterwards.
 */
async function runAction() {
  // Block duplicate submissions while one is already running.
  if (isLoading) return;

  if (!validateInput()) {
    return; // Validation already showed a helpful message.
  }

  // Capture the choice and text NOW, so later edits can't change an
  // in-flight request.
  const action = selectedAction;
  const text = inputText.value.trim();

  setLoading(true);
  renderLoading();

  try {
    const response = await fetch('/api/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: action, text: text })
    });

    // The server always sends JSON, but parse defensively anyway.
    let data = null;
    try {
      data = await response.json();
    } catch (parseError) {
      data = null;
    }

    // Case A: the server reported a problem (4xx/5xx).
    if (!response.ok) {
      const message =
        data && typeof data.message === 'string' && data.message
          ? data.message
          : `The server returned an error (HTTP ${response.status}). Please try again.`;
      renderError(message);
      return;
    }

    // Case B: "ok" response but the shape or content is unexpected.
    if (
      !data ||
      data.status !== 'ok' ||
      typeof data.result !== 'string' ||
      !data.result.trim()
    ) {
      renderError('The server returned an unexpected response. Please try again.');
      return;
    }

    // Case C: success.
    renderResult(action, data.result);
  } catch (networkError) {
    // fetch() only throws for network-level failures (server down, offline…).
    renderError(
      'Could not reach the server. Please make sure the backend is running, then try again.'
    );
  } finally {
    // Runs whether we succeeded or failed — the UI is always restored.
    setLoading(false);
  }
}

// ========================================
// Event listeners
// ========================================

/** Wire up all the events the page needs. */
function attachEventListeners() {
  // Action tabs: clicking one selects that action.
  actionTabs.forEach((tab) => {
    tab.addEventListener('click', () => selectAction(tab.dataset.action));
  });

  // Live character counter as the user types.
  inputText.addEventListener('input', () => {
    updateCharCounter();
    // If the user was shown an error, clear it once they start typing.
    if (inputText.hasAttribute('aria-invalid')) {
      clearError();
    }
  });

  // Run button.
  runActionBtn.addEventListener('click', runAction);
}

// ========================================
// Initialization
// ========================================

/** Set up the page when it first loads. */
function init() {
  updateCharCounter(); // show "0 / 5000" right away
  attachEventListeners();
}

// Run init once the HTML is fully parsed.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
