import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizePhone, phoneError, phoneMessage } from '../src/utils/phone.js';

const vectors = JSON.parse(readFileSync(new URL('./phone-numbers.json', import.meta.url)));

test('il portale normalizza i numeri validi come il backend', () => {
  for (const [input, normalized] of Object.entries(vectors.valid)) {
    assert.equal(normalizePhone(input), normalized, input);
    assert.equal(phoneError(input), null, input);
  }
});

test('il portale rifiuta gli stessi numeri non validi del backend', () => {
  for (const input of vectors.invalid) assert.equal(phoneError(input), phoneMessage, input);
});

const backendVectors = new URL('../../Ea-Express-backend/tests/fixtures/phone-numbers.json', import.meta.url);
test('i casi del portale coincidono con quelli del backend', { skip: !(() => { try { readFileSync(backendVectors); return true; } catch { return false; } })() }, () => {
  assert.deepEqual(JSON.parse(readFileSync(backendVectors)), vectors);
});
