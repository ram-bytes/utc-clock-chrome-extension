'use strict';

// ── EPOCH CONVERTER ──────────────────────────────────────────────────────────

const epochInput = document.getElementById('epoch');
const utcTimeEl  = document.getElementById('utc-time');
const tzTimeEl   = document.getElementById('tz-time');
const unitLabel  = document.getElementById('unit-label');
const tzSelect   = document.getElementById('tz-select');
const copyBtn    = document.getElementById('copy');
const convertBtn = document.getElementById('convert');
const resetBtn   = document.getElementById('reset');

let paused       = false;
let valueOnFocus = '';

function updateTime() {
  if (paused) return;
  const now = new Date();
  epochInput.value      = Math.floor(now.getTime() / 1000);
  utcTimeEl.textContent = formatUTC(now);
  unitLabel.textContent = 'Assumed: seconds';
  if (tzTimeEl.textContent) {
    tzTimeEl.textContent = formatInZone(now, tzSelect.value, tzSelect.selectedOptions[0].text);
  }
}

updateTime();
setInterval(updateTime, 1000);

epochInput.addEventListener('focus', () => { paused = true; valueOnFocus = epochInput.value; });
epochInput.addEventListener('blur', () => {
  if (epochInput.value === valueOnFocus) {
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
copyBtn.addEventListener('mousedown', () => { valueToCopy = epochInput.value; });
copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(valueToCopy);
});

let valueToConvert = '';
convertBtn.addEventListener('mousedown', () => { valueToConvert = epochInput.value; });
convertBtn.addEventListener('click', () => {
  const valStr = valueToConvert;
  if (!/^\d+$/.test(valStr)) return;

  const { unit, ms } = detectAndConvert(valStr);
  const date = new Date(ms);
  if (isNaN(date.getTime())) {
    utcTimeEl.textContent = 'Invalid timestamp';
    unitLabel.textContent = '';
  } else {
    const abbr = tzSelect.selectedOptions[0].text;
    const ianaZone = tzSelect.value;
    utcTimeEl.textContent = formatUTC(date);
    tzTimeEl.textContent  = formatInZone(date, ianaZone, abbr);
    unitLabel.textContent = `Assumed: ${unit}`;
    chrome.storage.local.set({ tzActive: true });
  }
});

resetBtn.addEventListener('click', () => {
  paused = false;
  tzTimeEl.textContent = '';
  chrome.storage.local.remove('tzActive');
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

chrome.storage.local.get(['colorPair', 'selectedTz', 'tzActive'], (result) => {
  let saved = result.colorPair;
  if (!saved) {
    saved = { bg: FIXED_BG, accent: '#ffab00' };
    chrome.storage.local.set({ colorPair: saved });
  }
  initColorPicker(saved);

  if (result.selectedTz) {
    const match = [...tzSelect.options].findIndex(o => o.text === result.selectedTz);
    if (match !== -1) tzSelect.selectedIndex = match;
  }

  if (result.tzActive) {
    tzTimeEl.textContent = formatInZone(new Date(), tzSelect.value, tzSelect.selectedOptions[0].text);
  }
});

tzSelect.addEventListener('change', () => {
  chrome.storage.local.set({ selectedTz: tzSelect.selectedOptions[0].text });
});
