import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/services/workspace-realtime.js', import.meta.url), 'utf8');
const stubbed = source.replace("import Echo from 'laravel-echo';", 'const Echo = globalThis.__testEcho;').replace("import Pusher from 'pusher-js';", 'const Pusher = class {};');

test('operational realtime subscribes to order changes without geographic listeners', async () => {
  const previousWindow = globalThis.window;
  const handlers = new Map(), dispatched = [];
  let disconnected = false;
  const channel = { subscribed(callback) { callback(); return this; }, listen(name, callback) { handlers.set(name, callback); return this; }, error() { return this; } };
  globalThis.window = { dispatchEvent(event) { dispatched.push(event); } };
  globalThis.__testEcho = class {
    connector = { pusher: { connection: { bind() {} } } };
    private() { return channel; }
    disconnect() { disconnected = true; }
  };
  try {
    const { connectWorkspace } = await import(`data:text/javascript,${encodeURIComponent(stubbed)}`);
    const cleanup = connectWorkspace(async () => ({ key: 'test', channel: 'customer.test', scheme: 'https' }));
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual([...handlers.keys()], ['.workspace.updated']);
    handlers.get('.workspace.updated')({ event_id: 'one', kind: 'order' });
    handlers.get('.workspace.updated')({ event_id: 'one', kind: 'order' });
    assert.equal(dispatched.filter(event => event.type === 'ea:workspace-updated' && event.detail.kind === 'order').length, 1);
    cleanup();
    assert.equal(disconnected, true);
  } finally {
    globalThis.window = previousWindow;
    delete globalThis.__testEcho;
  }
});
