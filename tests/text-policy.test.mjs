import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { portalTextError } from '../src/utils/text-policy.js';
import { contentFormData, contentLabel } from '../src/utils/order-content.js';

const fixture = process.env.EA_TEXT_POLICY_FIXTURE ? JSON.parse(readFileSync(process.env.EA_TEXT_POLICY_FIXTURE, 'utf8')) : null;
const policy = fixture?.policy || {terms: ['cocaina', 'hashish', 'fuck', 'cazzo', 'asshole', 'porco dio'], substitutions: {'0':'o','1':'i','3':'e','4':'a','5':'s','7':'t','@':'a','$':'s','ò':'o','à':'a','í':'i'}, message: 'Testo non consentito.'};

test('text policy rejects accents, case, common leetspeak, spacing and punctuation without erasing text', () => {
  for (const text of ['COCAINA', 'CÒCÀÍNÀ', 'co\u0301caina', 'c0c41n4', 'c@zz0', 'c o c a i n a', 'h.a.s.h.i.s.h', 'c-o c_a.i!n?a', 'Vendita (cocaina), online', 'coca\u200Bina', 'porco.dio', 'FUCK']) {
    assert.equal(portalTextError(text, policy), policy.message, text);
  }
});

test('text policy respects word boundaries and legitimate accented business descriptions', () => {
  for (const text of ['Abbigliamento', 'Caffè e artigianato', 'Assistenza e articoli classici', 'Scunthorpe document services', 'Accessori cocktail e cucina', 'Meridiana e ricambi', 'cocaina界', 'Documenti modello MDMA123', '']) {
    assert.equal(portalTextError(text, policy), null, text);
  }
});

test('client and server apply the same policy to shared regression vectors', {skip: !fixture}, () => {
  for (const text of fixture.blocked) assert.equal(portalTextError(text, policy), policy.message, text);
  for (const text of fixture.allowed) assert.equal(portalTextError(text, policy), null, text);
});

test('one content field maps suggestions and free text to the existing API storage contract', () => {
  assert.deepEqual(contentFormData('Abbigliamento'), {category:'clothing', content_description:''});
  assert.deepEqual(contentFormData('Ricambi per automobile'), {category:'custom', content_description:'Ricambi per automobile'});
  assert.deepEqual(contentFormData('Altro'), {category:'other', content_description:''});
  const legacy = {category:'clothing', content_description:'Abiti da cerimonia'};
  assert.deepEqual(contentFormData(contentLabel(legacy), legacy), legacy);
  assert.deepEqual(contentFormData('Documenti', legacy), {category:'documents', content_description:''});
});

test('submit validation checks editable fields without revalidating historical read-only identity on bookings', async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ok:true, status:200, json:async () => policy});
  try {
    const {validatePortalText} = await import('../src/services/text-policy.js?scope');
    assert.deepEqual(await validatePortalText({sender_type:'business', business_type:'cocaina'}), {business_type:[policy.message]});
    assert.deepEqual(await validatePortalText({content_description:'Ricambi per automobile'}), {});
    assert.deepEqual(await validatePortalText({content_description:'hashish'}), {content_description:[policy.message]});
  } finally { globalThis.fetch = previousFetch; }
});

test('policy loading deduplicates requests and permits retry after a network failure', async () => {
  const previousFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    if (calls === 1) throw new Error('offline');
    return {ok:true, status:200, json:async () => policy};
  };
  try {
    const {loadTextPolicy} = await import('../src/services/text-policy.js?retry');
    await assert.rejects(loadTextPolicy());
    const [first, second] = await Promise.all([loadTextPolicy(), loadTextPolicy()]);
    assert.deepEqual(first, policy);
    assert.strictEqual(first, second);
    assert.equal(calls, 2);
    assert.strictEqual(await loadTextPolicy(), first);
    assert.equal(calls, 2);
  } finally { globalThis.fetch = previousFetch; }
});
