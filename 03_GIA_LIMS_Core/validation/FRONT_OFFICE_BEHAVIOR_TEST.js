'use strict';
const assert = require('node:assert/strict');
const { normalizeNewOrderTest, normalizeEnteredResult } = require('../server/services/resultNormalization');
const catalog = { code: 'CBC', name: 'Complete Blood Count', price: 450, unit: 'cells/uL', reference: '4-11', active: true };
const panic = ({ value }) => ({ isPanic: value === '10', source: value === '10' ? 'TEST_LIMIT' : null });

const booked = normalizeNewOrderTest({ code: 'CBC', value: '999', status: 'Critical' }, catalog);
assert.equal(booked.value, 'Pending', 'new order must not accept client-supplied result');
assert.equal(booked.status, 'Pending', 'new order must not accept client-supplied status');
assert.equal(booked.isPanic, false, 'new order must not mark an unmeasured result panic');
assert.equal(booked.price, 450);

const blank = normalizeEnteredResult({ code: 'CBC', value: '', status: 'Normal' }, catalog, panic);
assert.equal(blank.value, 'Pending');
assert.equal(blank.status, 'Pending', 'blank value cannot be Normal');

const pending = normalizeEnteredResult({ code: 'CBC', value: 'Pending', status: 'Critical' }, catalog, panic);
assert.equal(pending.status, 'Pending', 'Pending value cannot carry a clinical status');

const valid = normalizeEnteredResult({ code: 'CBC', value: '5.2', status: 'Normal' }, catalog, panic);
assert.equal(valid.value, '5.2');
assert.equal(valid.status, 'Normal');
assert.equal(valid.unit, 'cells/uL');
assert.equal(valid.reference, '4-11');

const critical = normalizeEnteredResult({ code: 'CBC', value: '10', status: 'Critical' }, catalog, panic);
assert.equal(critical.status, 'Critical');
assert.equal(critical.isPanic, true);
assert.equal(critical.panicSource, 'TEST_LIMIT');

const invalidStatus = normalizeEnteredResult({ code: 'CBC', value: '5.2', status: 'Released' }, catalog, panic);
assert.equal(invalidStatus.status, 'Pending', 'unknown status must fail closed');
console.log('FRONT_OFFICE_BEHAVIOR_TEST PASS (6 scenarios)');
