import { test } from 'node:test';
import assert from 'node:assert/strict';
import { request } from '../src/api/client.js';

test('login exposes backend bot challenge without leaking it into field errors', async t => {
  t.mock.method(globalThis, 'fetch', async url => {
    if (url.endsWith('/csrf')) return Response.json({ csrf_token: 'csrf' });
    return Response.json({ message: 'Completa la verifica', bot_challenge: { site_key: 'public-key', action: 'login' } }, { status: 422 });
  });
  await assert.rejects(request('/auth/login', { method: 'POST', data: { email: 'test@example.test', password: 'secret' } }), error => {
    assert.equal(error.status, 422);
    assert.deepEqual(error.botChallenge, { site_key: 'public-key', action: 'login' });
    assert.deepEqual(error.errors, {});
    return true;
  });
});

test('rate limiting preserves seconds and Retry-After so the UI can count down accurately', async t => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ retry_after: 60 }, { status: 429, headers: { 'Retry-After': '10' } }));
  await assert.rejects(request('/auth/login', { method: 'POST', data: {} }), error => {
    assert.equal(error.retryAfter, 10);
    assert.match(error.message, /10 secondi/);
    return true;
  });
});

test('counter outage does not trigger a silent retry of the password request', async t => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; return Response.json({ message: 'Private internal details' }, { status: 503 }); });
  await assert.rejects(request('/auth/login', { method: 'POST', data: {} }), error => {
    assert.equal(error.status, 503);
    assert.doesNotMatch(error.message, /Private/);
    return true;
  });
  assert.equal(calls, 1);
});
