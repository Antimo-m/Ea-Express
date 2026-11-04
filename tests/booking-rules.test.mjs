import test from 'node:test';
import assert from 'node:assert/strict';
import { attachBookingRules, bookingLimits } from '../src/services/booking-rules.js';
const data = {pickup_date:'2026-09-20',pickup_from:'16:00',pickup_to:'17:00'};
test('same-day minimum follows Rome time and rounds forward to a selectable minute', () => {
    assert.equal(bookingLimits(Date.parse('2026-09-20T13:00:00Z'),data).time,'15:01');
    assert.equal(bookingLimits(Date.parse('2026-09-20T13:00:01Z'),data).time,'15:02');
});
test('future dates have no current-day minimum', () => {
    assert.equal(bookingLimits(Date.parse('2026-09-19T22:30:00Z'),{...data,pickup_date:'2026-09-21'}).time,'');
});
test('last partial minute of the day has no remaining selectable times', () => {
    assert.equal(bookingLimits(Date.parse('2026-09-20T21:59:01Z'),data).unavailable,true);
});
test('crossing midnight invalidates the previous date in Rome', () => {
    const limits=bookingLimits(Date.parse('2026-09-20T22:01:00Z'),data);
    assert.equal(limits.date,'2026-09-21');assert.equal(limits.unavailable,true);
});
test('customer historical schedules are revalidated while staff can retain an unchanged schedule', () => {
    assert.equal(bookingLimits(Date.parse('2026-09-21T13:00:00Z'),data,data).unavailable,true);
    assert.equal(bookingLimits(Date.parse('2026-09-21T13:00:00Z'),data,data,0).unavailable,false);
    assert.equal(bookingLimits(Date.parse('2026-09-21T13:00:00Z'),{...data,pickup_to:'18:00'},data).unavailable,true);
});
test('the DST transition skips nonexistent local hours', () => {
    const limits=bookingLimits(Date.parse('2026-03-29T00:59:30Z'),{...data,pickup_date:'2026-03-29'});
    assert.equal(limits.time,'03:01');
});

class Target {
    listeners = new Map();
    addEventListener(name, callback) { if (!this.listeners.has(name)) this.listeners.set(name, new Set()); this.listeners.get(name).add(callback); }
    removeEventListener(name, callback) { this.listeners.get(name)?.delete(callback); }
    emit(name, target) { for (const callback of this.listeners.get(name) || []) callback({target,preventDefault(){},stopImmediatePropagation(){}}); }
    get listenerCount() { return [...this.listeners.values()].reduce((total, values) => total + values.size, 0); }
}

function fakeField(value = '') {
    const attributes = new Map();
    const children = [];
    const field = {append(node) {children.push(node);}, querySelector() {return children.find(node => node.className === 'field-error' && !node.hidden);}};
    return {value, id:'pickup-start', closest() {return field;}, setCustomValidity(message) {this.validationMessage=message;},
        getAttribute(name) {return attributes.get(name);}, setAttribute(name, value) {attributes.set(name, value);}, removeAttribute(name) {attributes.delete(name);}, children};
}

test('live defaults advance, manual choices remain, expired starts show an accessible error and cleanup removes listeners', async t => {
    let elapsed = 0, tick, cleared = false;
    t.mock.method(performance, 'now', () => elapsed);
    t.mock.method(globalThis, 'setInterval', callback => {tick=callback;return 42;});
    t.mock.method(globalThis, 'clearInterval', id => {cleared=id===42;});
    const previousWindow = globalThis.window, previousDocument = globalThis.document;
    const window = new Target(), document = new Target();
    document.createElement = () => ({setAttribute(){},remove(){this.removed=true;}});
    globalThis.window=window; globalThis.document=document;
    const inputs = {pickup_date:fakeField('2026-11-04'),pickup_from:fakeField(),pickup_to:fakeField('12:00')};
    const form = new Target(); form.elements={namedItem:name=>inputs[name]}; form.reportValidity=()=>true;
    let cleanup;
    try {
        cleanup=attachBookingRules(form,{server_now:'2026-11-04T10:00:00+01:00'},null);
        assert.equal(inputs.pickup_from.value,'10:01');
        elapsed=10*60000; tick(); assert.equal(inputs.pickup_from.value,'10:11');
        inputs.pickup_from.value='12:00'; form.emit('input',inputs.pickup_from);
        elapsed=20*60000; tick(); assert.equal(inputs.pickup_from.value,'12:00');
        elapsed=121*60000; tick();
        assert.equal(inputs.pickup_from.value,'12:00');
        assert.match(inputs.pickup_from.validationMessage,/almeno un minuto/);
        assert.equal(inputs.pickup_from.getAttribute('aria-invalid'),'true');
        assert.match(inputs.pickup_from.getAttribute('aria-describedby'),/schedule-error/);
        assert.equal(inputs.pickup_from.children[0].hidden,false);
        inputs.pickup_date.value='2026-11-05'; form.emit('change',inputs.pickup_date);
        inputs.pickup_from.value='09:00'; form.emit('input',inputs.pickup_from);
        assert.equal(inputs.pickup_from.validationMessage,'');
        assert.equal(inputs.pickup_from.getAttribute('aria-invalid'),undefined);
        inputs.pickup_to.value='08:00'; form.emit('input',inputs.pickup_to);
        assert.match(inputs.pickup_to.validationMessage,/fine del ritiro/);
        cleanup(); cleanup=null;
        assert.equal(cleared,true); assert.equal(form.listenerCount,0); assert.equal(window.listenerCount,0); assert.equal(document.listenerCount,0);
        assert.equal(inputs.pickup_from.children[0].removed,true);
    } finally {
        cleanup?.(); globalThis.window=previousWindow; globalThis.document=previousDocument;
    }
});

test('an outstanding server clock response does not mutate fields after cleanup', async t => {
    t.mock.method(performance, 'now', () => 0);
    t.mock.method(globalThis, 'setInterval', () => 42); t.mock.method(globalThis, 'clearInterval', () => {});
    const previousWindow = globalThis.window, previousDocument = globalThis.document;
    globalThis.window=new Target(); globalThis.document=new Target(); globalThis.document.createElement=()=>({setAttribute(){},remove(){}});
    const inputs={pickup_date:fakeField(),pickup_from:fakeField(),pickup_to:fakeField()};
    const form=new Target(); form.elements={namedItem:name=>inputs[name]}; form.reportValidity=()=>true;
    let resolve;
    const response=new Promise(done=>{resolve=done;});
    try {
        const cleanup=attachBookingRules(form,{server_now:'2026-11-04T10:00:00+01:00'},null,()=>response);
        cleanup(); inputs.pickup_from.value='14:00'; resolve({server_now:'2026-11-04T15:00:00+01:00'}); await response; await Promise.resolve();
        assert.equal(inputs.pickup_from.value,'14:00');
    } finally {globalThis.window=previousWindow;globalThis.document=previousDocument;}
});
