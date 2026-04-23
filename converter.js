'use strict';

function detectAndConvert(valStr) {
  const len = valStr.length;
  if (len <= 10) return { unit: 'seconds',      ms: Number(valStr) * 1000 };
  if (len <= 13) return { unit: 'milliseconds',  ms: Number(valStr) };
  if (len <= 16) return { unit: 'microseconds',  ms: Number(valStr.slice(0, -3)) };
  return            { unit: 'nanoseconds',   ms: Number(valStr.slice(0, -6)) };
}

function formatUTC(date) {
  return `UTC: ${date.toISOString().replace('T', ' ').substring(0, 19)}`;
}

function formatInZone(date, ianaZone, abbr) {
  const formatted = date.toLocaleString('en-CA', {
    timeZone: ianaZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hourCycle: 'h23'
  }).replace(', ', ' ');
  return `${abbr}: ${formatted}`;
}

if (typeof module !== 'undefined') module.exports = { detectAndConvert, formatUTC, formatInZone };
