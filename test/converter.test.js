'use strict';

const { test } = require('node:test');
const assert   = require('node:assert/strict');
const { detectAndConvert, formatUTC, formatInZone } = require('../converter.js');

// Fixed UTC timestamp: 2024-01-15 12:00:00 UTC (mid-winter, DST inactive everywhere)
const UTC_DATE = new Date('2024-01-15T12:00:00.000Z');

// ── formatUTC ─────────────────────────────────────────────────────────────────

test('formatUTC – formats date as UTC: YYYY-MM-DD HH:MM:SS', () => {
  assert.equal(formatUTC(UTC_DATE), 'UTC: 2024-01-15 12:00:00');
});

// ── formatInZone ──────────────────────────────────────────────────────────────

const ZONE_CASES = [
  // [abbr, ianaZone, expected, note]
  ['AEST', 'Australia/Sydney',    'AEST: 2024-01-15 23:00:00', 'UTC+11 in Jan (AEDT)'],
  ['BST',  'Europe/London',       'BST: 2024-01-15 12:00:00',  'UTC+0 in Jan'],
  ['CDT',  'America/Chicago',     'CDT: 2024-01-15 06:00:00',  'UTC-6 in Jan (CST)'],
  ['CEST', 'Europe/Paris',        'CEST: 2024-01-15 13:00:00', 'UTC+1 in Jan (CET)'],
  ['CET',  'Europe/Paris',        'CET: 2024-01-15 13:00:00',  'UTC+1 in Jan'],
  ['China ST', 'Asia/Shanghai',   'China ST: 2024-01-15 20:00:00', 'UTC+8'],
  ['CST',  'America/Chicago',     'CST: 2024-01-15 06:00:00',  'UTC-6 in Jan'],
  ['EDT',  'America/New_York',    'EDT: 2024-01-15 07:00:00',  'UTC-5 in Jan (EST)'],
  ['EST',  'America/New_York',    'EST: 2024-01-15 07:00:00',  'UTC-5 in Jan'],
  ['IST',  'Asia/Kolkata',        'IST: 2024-01-15 17:30:00',  'UTC+5:30'],
  ['JST',  'Asia/Tokyo',          'JST: 2024-01-15 21:00:00',  'UTC+9'],
  ['KST',  'Asia/Seoul',          'KST: 2024-01-15 21:00:00',  'UTC+9'],
  ['MDT',  'America/Denver',      'MDT: 2024-01-15 05:00:00',  'UTC-7 in Jan (MST)'],
  ['MSK',  'Europe/Moscow',       'MSK: 2024-01-15 15:00:00',  'UTC+3'],
  ['MST',  'America/Denver',      'MST: 2024-01-15 05:00:00',  'UTC-7 in Jan'],
  ['PDT',  'America/Los_Angeles', 'PDT: 2024-01-15 04:00:00',  'UTC-8 in Jan (PST)'],
  ['PST',  'America/Los_Angeles', 'PST: 2024-01-15 04:00:00',  'UTC-8 in Jan'],
  ['SGT',  'Asia/Singapore',      'SGT: 2024-01-15 20:00:00',  'UTC+8'],
];

for (const [abbr, zone, expected, note] of ZONE_CASES) {
  test(`${abbr} – ${zone} (${note})`, () => {
    assert.equal(formatInZone(UTC_DATE, zone, abbr), expected);
  });
}

// ── midnight boundary (hourCycle h23 fix — must show 00:00:00 not 24:00:00) ──

test('JST midnight – 2024-01-14T15:00:00Z is 2024-01-15 00:00:00 in JST', () => {
  const midnight = new Date('2024-01-14T15:00:00.000Z'); // UTC+9 → exactly midnight JST
  assert.equal(formatInZone(midnight, 'Asia/Tokyo', 'JST'), 'JST: 2024-01-15 00:00:00');
});

test('PST midnight – 2024-01-15T08:00:00Z is 2024-01-15 00:00:00 in PST', () => {
  const midnight = new Date('2024-01-15T08:00:00.000Z'); // UTC-8 → exactly midnight PST
  assert.equal(formatInZone(midnight, 'America/Los_Angeles', 'PST'), 'PST: 2024-01-15 00:00:00');
});

// ── detectAndConvert ──────────────────────────────────────────────────────────

test('detectAndConvert – seconds (10 digits)', () => {
  assert.deepEqual(detectAndConvert('1705320000'), { unit: 'seconds', ms: 1705320000000 });
});

test('detectAndConvert – milliseconds (13 digits)', () => {
  assert.deepEqual(detectAndConvert('1705320000000'), { unit: 'milliseconds', ms: 1705320000000 });
});

test('detectAndConvert – microseconds (16 digits)', () => {
  assert.deepEqual(detectAndConvert('1705320000000000'), { unit: 'microseconds', ms: 1705320000000 });
});

test('detectAndConvert – nanoseconds (19 digits)', () => {
  assert.deepEqual(detectAndConvert('1705320000000000000'), { unit: 'nanoseconds', ms: 1705320000000 });
});
