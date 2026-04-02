'use strict';

// ── EPOCH CONVERTER ──────────────────────────────────────────────────────────

const epochInput = document.getElementById('epoch');
const utcTimeEl  = document.getElementById('utc-time');
const unitLabel  = document.getElementById('unit-label');

function detectAndConvert(valStr) {
  const len = valStr.length;
  if (len <= 10) return { unit: 'seconds',      ms: Number(valStr) * 1000 };
  if (len <= 13) return { unit: 'milliseconds',  ms: Number(valStr) };
  if (len <= 16) return { unit: 'microseconds',  ms: Number(valStr.slice(0, -3)) };
  return            { unit: 'nanoseconds',   ms: Number(valStr.slice(0, -6)) };
}

let paused      = false;
let frozen      = false;
let valueOnFocus = '';

function updateTime() {
  if (paused) return;
  const now = new Date();
  epochInput.value       = Math.floor(now.getTime() / 1000);
  utcTimeEl.textContent  = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  unitLabel.textContent  = 'Assumed: seconds';
}

updateTime();
setInterval(updateTime, 1000);

epochInput.addEventListener('focus', () => { paused = true; valueOnFocus = epochInput.value; });
epochInput.addEventListener('blur', () => {
  if (epochInput.value === valueOnFocus) {
    frozen = false;
    paused = false;
    updateTime();
  }
  // Value changed — stay paused until Reset is clicked
});

// Only allow digits, max 19 (nanoseconds up to year 2286)
epochInput.addEventListener('input', () => {
  epochInput.value = epochInput.value.replace(/\D/g, '').slice(0, 19);
});

// Capture value on mousedown so blur can't change it before click fires
let valueToCopy = '';
document.getElementById('copy').addEventListener('mousedown', () => { valueToCopy = epochInput.value; });
document.getElementById('copy').addEventListener('click', () => {
  navigator.clipboard.writeText(valueToCopy);
});

// mousedown fires before blur — only freeze if input is currently focused/paused
document.getElementById('convert').addEventListener('mousedown', () => { if (paused) frozen = true; });
document.getElementById('convert').addEventListener('click', () => {
  const valStr = epochInput.value;
  if (!/^\d+$/.test(valStr)) return;

  const { unit, ms } = detectAndConvert(valStr);
  const date = new Date(ms);
  if (isNaN(date.getTime())) {
    utcTimeEl.textContent = 'Invalid timestamp';
    unitLabel.textContent = '';
  } else {
    utcTimeEl.textContent = date.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    unitLabel.textContent = `Assumed: ${unit}`;
  }
});

document.getElementById('reset').addEventListener('click', () => {
  frozen = false;
  paused = false;
  epochInput.blur();
  updateTime();
});

// ── COLOR PICKER ─────────────────────────────────────────────────────────────

const FIXED_BG = '#000000';

const PRESET_ACCENTS = [
  '#ffffff', // white
  '#00ff00', // lime green
  '#00e5ff', // electric cyan
  '#ffab00', // amber
  '#ff1744', // vivid red
  '#448aff', // electric blue
  '#ff6d00', // orange
];

function initColorPicker(saved) {
  const grid = document.getElementById('grid');

  function clearSelected() {
    document.querySelectorAll('.cell').forEach(c => c.classList.remove('selected'));
  }

  function saveAccent(accent) {
    chrome.storage.local.set({ colorPair: { bg: FIXED_BG, accent } });
  }

  // 7 preset accent cells
  PRESET_ACCENTS.forEach((accent) => {
    const cell = document.createElement('button');
    cell.className = 'cell';
    cell.style.setProperty('--accent', accent);
    if (accent === saved.accent) cell.classList.add('selected');

    cell.addEventListener('click', () => {
      clearSelected();
      cell.classList.add('selected');
      saveAccent(accent);
    });

    grid.appendChild(cell);
  });

  // 8th cell: custom accent color picker (rainbow when unselected)
  const isCustom     = !PRESET_ACCENTS.includes(saved.accent);
  const customAccent = isCustom ? saved.accent : '#888888';

  const customCell  = document.createElement('button');
  customCell.className = 'cell custom';
  customCell.style.setProperty('--accent', customAccent);
  if (isCustom) customCell.classList.add('selected');

  const colorInput  = document.createElement('input');
  colorInput.type   = 'color';
  colorInput.value  = customAccent;

  colorInput.addEventListener('input', () => {
    clearSelected();
    customCell.classList.add('selected');
    customCell.style.setProperty('--accent', colorInput.value);
    saveAccent(colorInput.value);
  });

  customCell.appendChild(colorInput);
  grid.appendChild(customCell);
}

chrome.storage.local.get('colorPair', (result) => {
  let saved = result.colorPair;
  if (!saved) {
    saved = { bg: FIXED_BG, accent: '#ffab00' };
    chrome.storage.local.set({ colorPair: saved });
  }
  initColorPicker(saved);
});
