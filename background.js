'use strict';

const DEFAULT_COLORS = { bg: '#000000', accent: '#ffab00' };
let currentColors = { ...DEFAULT_COLORS };

function drawUTCIcon(size) {
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = currentColors.bg;
  ctx.fillRect(0, 0, size, size);

  const fontSize = Math.round(size * 0.55);
  ctx.fillStyle = currentColors.accent;
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('UTC', size / 2, size * 0.35);

  return ctx.getImageData(0, 0, size, size);
}

function setUTCIcon() {
  chrome.action.setIcon({
    imageData: {
      16:  drawUTCIcon(16),
      48:  drawUTCIcon(48),
      128: drawUTCIcon(128),
    }
  });
}

let lastMinute = -1;

function updateBadge() {
  const now = new Date();
  const minute = now.getUTCMinutes();

  if (minute === lastMinute) return;
  lastMinute = minute;

  const h = String(now.getUTCHours());
  const m = String(minute).padStart(2, '0');

  chrome.action.setBadgeText({ text: `${h}:${m}` });
  chrome.action.setTitle({ title: now.toISOString().replace('T', ' ').substring(0, 16) + ' UTC' });
}

function applyColors() {
  chrome.action.setBadgeBackgroundColor({ color: currentColors.accent });
  chrome.action.setBadgeTextColor({ color: currentColors.bg });
  setUTCIcon();
  lastMinute = -1;
  updateBadge();
}

function scheduleNextMinute() {
  const now = Date.now();
  const nextMinute = Math.ceil(now / 60000) * 60000;
  chrome.alarms.create('tick', {
    when: nextMinute,
    periodInMinutes: 1
  });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'tick') updateBadge();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.colorPair) {
    currentColors = changes.colorPair.newValue;
    applyColors();
  }
});

function initDisplay() {
  chrome.storage.local.get('colorPair', (result) => {
    if (result.colorPair) currentColors = result.colorPair;
    applyColors();
    scheduleNextMinute();
  });
}

chrome.runtime.onInstalled.addListener(initDisplay);
chrome.runtime.onStartup.addListener(initDisplay);

// On alarm wakeup, neither onInstalled nor onStartup fire — run icon+badge directly.
// Do NOT call scheduleNextMinute here; the alarm persists across SW restarts.
chrome.storage.local.get('colorPair', (result) => {
  if (result.colorPair) currentColors = result.colorPair;
  setUTCIcon();
  updateBadge();
});
