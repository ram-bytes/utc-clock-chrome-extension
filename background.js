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

let iconCache = null;
let iconCacheKey = null;

function setUTCIcon() {
  const key = `${currentColors.bg}|${currentColors.accent}`;
  if (iconCacheKey !== key) {
    iconCache = {
      16:  drawUTCIcon(16),
      48:  drawUTCIcon(48),
      128: drawUTCIcon(128),
    };
    iconCacheKey = key;
  }
  chrome.action.setIcon({ imageData: iconCache });
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

// initDone prevents double-init when onInstalled/onStartup fires on the same
// SW activation as the module-level call below.
let initDone = false;

function init() {
  if (initDone) return;
  initDone = true;
  chrome.storage.local.get('colorPair', (result) => {
    if (result.colorPair) currentColors = result.colorPair;
    applyColors();
    chrome.alarms.get('tick', (alarm) => {
      if (!alarm) scheduleNextMinute();
    });
  });
}

// onInstalled/onStartup registration tells Chrome to start this SW on browser
// launch and extension install — without them the icon stays blank until the
// first alarm fires.
chrome.runtime.onInstalled.addListener(init);
chrome.runtime.onStartup.addListener(init);
init(); // also covers alarm wakeup (neither event fires in that case)
