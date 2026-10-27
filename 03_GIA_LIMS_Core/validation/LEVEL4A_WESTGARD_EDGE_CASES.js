'use strict';
const assert = require('node:assert/strict');
const { westgardEvaluate } = require('../server/services/westgard');
const cases = [
  {name:'2SD exact boundary', points:[104], target:100, sd:2, status:'PASS'},
  {name:'3SD exact boundary', points:[106], target:100, sd:2, status:'WARNING'},
  {name:'strict 1_3s exceedance', points:[106.02], target:100, sd:2, status:'FAIL'},
  {name:'R_4s must not infer from historical points', points:[104.2,95.8], target:100, sd:2, notRule:'R_4s'},
  {name:'R_4s explicit same-run pair', points:[100], target:100, sd:2, pair:[-2.1,2.1], rule:'R_4s'},
  {name:'R_4s zero and high positive must not reject', points:[100], target:100, sd:2, pair:[0,4.1], notRule:'R_4s'},
  {name:'R_4s requires both sides beyond 2 SD', points:[100], target:100, sd:2, pair:[-1,3.1], notRule:'R_4s'},
  {name:'R_4s accepts reverse order of opposite limits', points:[100], target:100, sd:2, pair:[2.1,-2.1], rule:'R_4s'},
  {name:'2_2s must require same side', points:[104.2,95.8], target:100, sd:2, notRule:'2_2s'},
  {name:'bad data must not be silently filtered', points:[99,'x',101], target:100, sd:2, status:'INVALID'}
];
let killed=0;
for(const c of cases){const r=westgardEvaluate(c.points,c.target,c.sd,c.pair||null);if(c.status)assert.equal(r.status,c.status,c.name);if(c.rule)assert.ok(r.rules.includes(c.rule),c.name);if(c.notRule)assert.ok(!r.rules.includes(c.notRule),c.name);killed++;console.log(`PASS ${c.name}`);}
console.log(`LEVEL4A_WESTGARD_EDGE_CASES PASS (${killed}/${cases.length})`);
