import test from 'node:test';
import assert from 'node:assert/strict';
import { pickupAddress, samePickupAddress, completePickupAddress } from '../src/utils/pickup-address.js';

const address = { pickup_address: 'Via Roma', pickup_street_number: '12/A', pickup_postal_code: '80100', pickup_city: 'Napoli' };

test('equivalent pickup addresses ignore case, spacing and punctuation without involving recipients', () => {
  assert.equal(samePickupAddress(address, {...address, pickup_address: '  VIA.  ROMA ', pickup_street_number: '12 / a', pickup_city: ' NAPOLI  ', delivery_address: 'Different street'}), true);
  assert.equal(samePickupAddress(address, {...address, pickup_street_number: '13'}), false);
  assert.equal(samePickupAddress({...address, pickup_street_number: '1/2'}, {...address, pickup_street_number: '12'}), false);
  assert.equal(samePickupAddress(null, address), false);
});

test('saving a pickup address excludes personal recipient data and validates a complete pickup', () => {
  assert.deepEqual(pickupAddress({...address, recipient_name: 'Recipient', recipient_phone: '123456789', delivery_address: 'Not saved', store_name: 'Business'}), address);
  assert.equal(completePickupAddress(address), true);
  assert.equal(completePickupAddress({...address, pickup_postal_code: '8010'}), false);
  assert.equal(completePickupAddress({...address, pickup_street_number: ''}), false);
});
