import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dayNumber, indexFor, pickFor, OFFSET } from './daily.mjs';

const DAY = 86400000;

test('dayNumber: whole UTC days, floored, 0 on garbage', () => {
  assert.equal(dayNumber(0), 0);
  assert.equal(dayNumber(DAY), 1);
  assert.equal(dayNumber(DAY + DAY - 1), 1);        // still day 1 until the next midnight
  assert.equal(dayNumber(2 * DAY), 2);
  assert.equal(dayNumber(NaN), 0);
  assert.equal(dayNumber('x'), 0);
});

test('indexFor: in range, rotates by day, wraps, and is non-negative before the epoch', () => {
  assert.equal(indexFor(0, 16), (0 + OFFSET) % 16);
  assert.equal(indexFor(DAY, 16), (1 + OFFSET) % 16);
  // a full lap of n days returns to the same index
  assert.equal(indexFor(0, 16), indexFor(16 * DAY, 16));
  // consecutive days differ (no repeat two days running while n>1)
  assert.notEqual(indexFor(0, 16), indexFor(DAY, 16));
  // never out of range, ever
  for (let d = -40; d < 400; d++) { const i = indexFor(d * DAY, 16); assert.ok(i >= 0 && i < 16, 'in range at day ' + d); }
  // a date before the epoch still gives a valid non-negative index (the (x%n+n)%n guard)
  assert.ok(indexFor(-5 * DAY, 16) >= 0);
  // degenerate libraries never throw
  assert.equal(indexFor(DAY, 0), 0);
  assert.equal(indexFor(DAY, -3), 0);
  assert.equal(indexFor(DAY, 2.5), 0);
});

test('pickFor: returns the day\'s prompt with its index and day number; empty is null', () => {
  const lib = ['a', 'b', 'c'];
  const p = pickFor(lib, 3 * DAY);
  assert.equal(p.day, 3);
  assert.equal(p.index, (3 + OFFSET) % 3);
  assert.equal(p.prompt, lib[p.index]);
  assert.equal(pickFor([], DAY), null);
  assert.equal(pickFor('nope', DAY), null);
});

test('the shipped library is real and well-formed — every prompt earns its place', () => {
  const data = JSON.parse(readFileSync(fileURLToPath(new URL('./prompts.json', import.meta.url)), 'utf8'));
  assert.ok(Array.isArray(data.prompts) && data.prompts.length >= 14, 'at least two weeks of prompts');
  const titles = new Set();
  for (const p of data.prompts) {
    for (const k of ['title', 'use', 'system', 'principle']) assert.ok(typeof p[k] === 'string' && p[k].trim().length > 0, 'missing ' + k);
    assert.ok(p.system.length >= 200, 'a real system prompt, not a one-liner: ' + p.title);
    assert.ok(!titles.has(p.title), 'no duplicate titles'); titles.add(p.title);
    // no pricing on the product (surface rule)
    assert.ok(!/[£$€]\s?\d/.test(p.system + p.use + p.title), 'no prices in the product: ' + p.title);
  }
  // every day of a full rotation lands on a real prompt
  for (let d = 0; d < data.prompts.length; d++) assert.ok(pickFor(data.prompts, d * DAY).prompt.system, 'day ' + d);
});
