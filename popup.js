'use strict';

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

chrome.storage.local.get('colorPair', (result) => {
  const saved = result.colorPair || { bg: FIXED_BG, accent: PRESET_ACCENTS[0] };
  const grid = document.getElementById('grid');

  function clearSelected() {
    document.querySelectorAll('.cell').forEach(c => c.classList.remove('selected'));
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
      chrome.storage.local.set({ colorPair: { bg: FIXED_BG, accent } });
    });

    grid.appendChild(cell);
  });

  // 8th cell: custom accent color picker
  const isCustom = !PRESET_ACCENTS.includes(saved.accent);
  const customAccent = isCustom ? saved.accent : '#888888';

  const customCell = document.createElement('button');
  customCell.className = 'cell custom';
  customCell.style.setProperty('--accent', customAccent);
  if (isCustom) customCell.classList.add('selected');

  const colorInput = document.createElement('input');
  colorInput.type = 'color';
  colorInput.value = customAccent;

  colorInput.addEventListener('input', () => {
    clearSelected();
    customCell.classList.add('selected');
    customCell.style.setProperty('--accent', colorInput.value);
    chrome.storage.local.set({ colorPair: { bg: FIXED_BG, accent: colorInput.value } });
  });

  customCell.appendChild(colorInput);
  grid.appendChild(customCell);
});
