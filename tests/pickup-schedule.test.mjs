import test from 'node:test';
import assert from 'node:assert/strict';
import { bookingLimits, defaultPickupSchedule } from '../src/services/booking-rules.js';

const instant = value => Date.parse(value);
const data = {pickup_date:'2026-11-04', pickup_from:'10:36', pickup_to:'12:00'};

test('pickup minimum leaves at least one full minute, including seconds and exact minute boundaries', () => {
    assert.equal(bookingLimits(instant('2026-11-04T10:35:00+01:00'), data).time, '10:36');
    assert.equal(bookingLimits(instant('2026-11-04T10:35:00.001+01:00'), data).time, '10:37');
    assert.equal(bookingLimits(instant('2026-11-04T10:35:59+01:00'), data).time, '10:37');
});

test('untouched default advances with the server clock instead of staying at opening time', () => {
    const opened = defaultPickupSchedule(instant('2026-11-04T10:00:00+01:00'));
    const later = defaultPickupSchedule(instant('2026-11-04T10:10:00+01:00'));
    assert.equal(opened.pickup_from, '10:01');
    assert.equal(later.pickup_from, '10:11');
    assert.ok(later.pickup_to > later.pickup_from);
});

test('future dates remain independent of the current hour and retain the existing morning default', () => {
    const now = instant('2026-11-04T18:30:25+01:00');
    assert.equal(bookingLimits(now, {...data,pickup_date:'2026-11-05'}).time, '');
    assert.deepEqual(defaultPickupSchedule(now, '2026-11-05', true), {pickup_date:'2026-11-05',pickup_from:'09:00',pickup_to:'12:00'});
    assert.equal(bookingLimits(now, {...data,pickup_date:'2026-11-03'}).unavailable, true);
});

test('midnight advances an untouched date and avoids a start with no possible later end on the same day', () => {
    assert.deepEqual(defaultPickupSchedule(instant('2026-11-04T23:58:00+01:00')), {pickup_date:'2026-11-05',pickup_from:'00:00',pickup_to:'12:00'});
    assert.deepEqual(defaultPickupSchedule(instant('2026-11-04T23:59:25+01:00')), {pickup_date:'2026-11-05',pickup_from:'00:01',pickup_to:'12:00'});
    const manual = defaultPickupSchedule(instant('2026-11-05T00:00:00+01:00'), '2026-11-04', true);
    assert.equal(manual.pickup_date, '2026-11-04');
    assert.equal(bookingLimits(instant('2026-11-05T00:00:00+01:00'), manual).unavailable, true);
});

test('Italian operational time is consistent even when the device clock is expressed in another timezone', () => {
    const local = defaultPickupSchedule(instant('2026-11-04T10:35:00+01:00'));
    const abroad = defaultPickupSchedule(instant('2026-11-04T01:35:00-08:00'));
    assert.deepEqual(local, abroad);
    assert.deepEqual(defaultPickupSchedule(instant('2026-03-29T01:59:30+01:00')), {pickup_date:'2026-03-29',pickup_from:'03:01',pickup_to:'12:00'});
});

test('historical customer schedules require a future time while the staff compatibility opt-in remains unchanged', () => {
    const original = {...data,pickup_date:'2026-11-03'};
    const now = instant('2026-11-04T10:35:00+01:00');
    assert.equal(bookingLimits(now, original, original).unavailable, true);
    const staff = bookingLimits(now, original, original, 0);
    assert.equal(staff.unchanged, true);
    assert.equal(staff.unavailable, false);
});
