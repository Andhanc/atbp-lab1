const API_BASE = '';

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Выделяет запрещённые слова жирным, сохраняя регистр и разделители (как на сервере).
 */
function highlightForbiddenWords(text, forbiddenWords) {
  if (!forbiddenWords || forbiddenWords.length === 0) {
    return escapeHtml(text).replace(/\n/g, '<br>');
  }
  const forbiddenLower = new Set(
    forbiddenWords.map((w) => String(w).toLowerCase())
  );
  const parts = text.split(/(\s+)/);
  return parts
    .map((part) => {
      if (/^\s+$/.test(part)) {
        return escapeHtml(part).replace(/\n/g, '<br>');
      }
      const cleaned = part.replace(/[.,!?;:()\[\]{}'"]/g, '').toLowerCase();
      if (forbiddenLower.has(cleaned)) {
        return `<strong>${escapeHtml(part)}</strong>`;
      }
      return escapeHtml(part);
    })
    .join('');
}

function formatPercent(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '0';
  }
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

async function loadSpamWords() {
  const listEl = document.getElementById('spamWordsList');
  const errEl = document.getElementById('wordsLoadError');
  errEl.hidden = true;
  listEl.innerHTML = '';

  const res = await fetch(`${API_BASE}/api/config/spam-words`);
  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.status !== 'success' || !Array.isArray(data.spamWords)) {
    errEl.textContent =
      data.message || 'Не удалось загрузить список запрещённых слов';
    errEl.hidden = false;
    return [];
  }

  for (const word of data.spamWords) {
    const li = document.createElement('li');
    li.textContent = word;
    listEl.appendChild(li);
  }
  return data.spamWords;
}

async function checkSpam() {
  const messageInput = document.getElementById('messageInput');
  const errorArea = document.getElementById('errorArea');
  const resultArea = document.getElementById('resultArea');
  const spamPercentLine = document.getElementById('spamPercentLine');
  const highlightedMessage = document.getElementById('highlightedMessage');

  errorArea.hidden = true;
  resultArea.hidden = true;
  errorArea.textContent = '';

  const text = messageInput.value;
  if (typeof text !== 'string' || text.trim().length === 0) {
    errorArea.textContent = 'Текст не должен быть пустым';
    errorArea.hidden = false;
    return;
  }

  const res = await fetch(`${API_BASE}/api/spam/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  const data = await res.json().catch(() => ({}));

  if (res.status === 400 && data.status === 'error') {
    errorArea.textContent = data.message || 'Текст не должен быть пустым';
    errorArea.hidden = false;
    return;
  }

  if (!res.ok || data.status !== 'success') {
    errorArea.textContent =
      data.message || 'Ошибка при проверке текста на спам';
    errorArea.hidden = false;
    return;
  }

  const forbiddenWords =
    cachedSpamWords && cachedSpamWords.length > 0
      ? cachedSpamWords
      : await loadSpamWordsForHighlight();
  spamPercentLine.textContent = `Спам: ${formatPercent(data.spamPercentage)}%`;
  highlightedMessage.innerHTML = highlightForbiddenWords(text, forbiddenWords);
  resultArea.hidden = false;
}

let cachedSpamWords = null;

async function loadSpamWordsForHighlight() {
  if (cachedSpamWords) {
    return cachedSpamWords;
  }
  const res = await fetch(`${API_BASE}/api/config/spam-words`);
  const data = await res.json().catch(() => ({}));
  if (res.ok && data.status === 'success' && Array.isArray(data.spamWords)) {
    cachedSpamWords = data.spamWords;
    return cachedSpamWords;
  }
  return [];
}

document.getElementById('checkSpamBtn').addEventListener('click', () => {
  checkSpam();
});

loadSpamWords().then((words) => {
  cachedSpamWords = words;
});
