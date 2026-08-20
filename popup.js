'use strict';

// ── EPOCH CONVERTER ──────────────────────────────────────────────────────────

const epochInput   = document.getElementById('epoch');
const utcTimeEl    = document.getElementById('utc-time');
const worldClockEl = document.getElementById('world-clock');
const unitLabel    = document.getElementById('unit-label');
const tzSelect     = document.getElementById('tz-select');
const copyBtn      = document.getElementById('copy');
const convertBtn   = document.getElementById('convert');
const resetBtn     = document.getElementById('reset');
const addZoneBtn   = document.getElementById('add-zone');

let paused       = false;
let valueOnFocus = '';

// Favorite zones shown in the world clock: [{ abbr, iana }]
let zones = [];

function renderRows() {
  worldClockEl.innerHTML = '';
  zones.forEach((zone, i) => {
    const row = document.createElement('div');
    row.className = 'wc-row';

    const time = document.createElement('span');
    time.className = 'wc-time';
    row.appendChild(time);

    const remove = document.createElement('button');
    remove.className = 'wc-remove';
    remove.textContent = '×';
    remove.title = 'Remove';
    remove.addEventListener('click', () => {
      zones.splice(i, 1);
      saveZones();
      renderRows();
      renderClock(shownDate());
    });
    row.appendChild(remove);

    worldClockEl.appendChild(row);
  });
}

// Fill UTC + every zone row with the given instant.
function renderClock(date) {
  utcTimeEl.textContent = formatUTC(date);
  const rows = worldClockEl.querySelectorAll('.wc-time');
  zones.forEach((zone, i) => {
    if (rows[i]) rows[i].textContent = formatInZone(date, zone.iana, zone.abbr);
  });
}

// The instant currently displayed: paused → the epoch in the field, else now.
function shownDate() {
  if (paused) {
    const val = epochInput.value;
    if (/^\d+$/.test(val)) return new Date(detectAndConvert(val).ms);
  }
  return new Date();
}

function saveZones() {
  chrome.storage.local.set({ worldZones: zones });
}

function updateTime() {
  if (paused) return;
  const now = new Date();
  epochInput.value      = Math.floor(now.getTime() / 1000);
  unitLabel.textContent = 'Assumed: seconds';
  renderClock(now);
}

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
    paused = true;
    unitLabel.textContent = `Assumed: ${unit}`;
    renderClock(date);
  }
});

resetBtn.addEventListener('click', () => {
  paused = false;
  epochInput.blur();
  updateTime();
});

// Add the selected zone to the world clock (dedupe by abbreviation).
addZoneBtn.addEventListener('click', () => {
  const abbr = tzSelect.selectedOptions[0].text;
  const iana = tzSelect.value;
  if (zones.some(z => z.abbr === abbr)) return;
  zones.push({ abbr, iana });
  saveZones();
  renderRows();
  renderClock(shownDate());
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

chrome.storage.local.get(['colorPair', 'worldZones'], (result) => {
  let saved = result.colorPair;
  if (!saved) {
    saved = { bg: FIXED_BG, accent: '#ffab00' };
    chrome.storage.local.set({ colorPair: saved });
  }
  initColorPicker(saved);

  // Load favorite zones; default to none (UTC-only) until the user adds some.
  zones = Array.isArray(result.worldZones) ? result.worldZones : [];
  renderRows();
  updateTime();
});

// ── THEME TOGGLE ─────────────────────────────────────────────────────────────

const themeToggle = document.getElementById('theme-toggle');
const grid        = document.getElementById('grid');
themeToggle.addEventListener('click', () => {
  const collapsed = grid.classList.toggle('collapsed');
  themeToggle.classList.toggle('expanded', !collapsed);
});
