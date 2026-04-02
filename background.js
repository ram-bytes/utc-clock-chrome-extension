'use strict';

function drawUTCIcon(size) {
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Dark background
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, size, size);

  // "UTC" centered in green
  const fontSize = Math.round(size * 0.55);
  ctx.fillStyle = '#00ff00';
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

function getUTCTime() {
  const now = new Date();
  const h = String(now.getUTCHours()).padStart(2, '0');
  const m = String(now.getUTCMinutes()).padStart(2, '0');
  return { h, m, minute: now.getUTCMinutes() };
}

function updateBadge() {
  const { h, m, minute } = getUTCTime();

  if (minute === lastMinute) return;
  lastMinute = minute;

  const text = `${h}:${m}`;

  chrome.action.setBadgeText({ text });

  const now = new Date();
  const iso = now.toISOString().replace('T', ' ').substring(0, 16) + ' UTC';
  chrome.action.setTitle({ title: iso });
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

function initDisplay() {
  chrome.action.setBadgeTextColor({ color: '#000000' });
  chrome.action.setBadgeBackgroundColor({ color: '#00ff00' });
  setUTCIcon();
  updateBadge();
  scheduleNextMinute();
}

chrome.runtime.onInstalled.addListener(initDisplay);
chrome.runtime.onStartup.addListener(initDisplay);

// On alarm wakeup, neither onInstalled nor onStartup fire — run icon+badge directly.
// Do NOT call scheduleNextMinute here; the alarm persists across SW restarts.
setUTCIcon();
updateBadge();
