'use strict';

const RESULT_STATUSES = new Set(['Normal', 'High', 'Low', 'Critical']);

/** A newly booked accession must not accept client-supplied clinical results. */
function normalizeNewOrderTest(input, catalogItem) {
  return {
    code: catalogItem.code,
    name: catalogItem.name,
    price: Number(catalogItem.price) || 0,
    value: 'Pending',
    unit: catalogItem.unit || '',
    reference: catalogItem.reference || '',
    status: 'Pending',
    method: String(input?.method || 'Automated Analyzer').slice(0, 128),
    isPanic: false
  };
}

/** A result remains Pending until a nonblank value and an allowed status exist. */
function normalizeEnteredResult(input, catalogItem, evaluatePanic) {
  const value = String(input?.value ?? 'Pending').trim().slice(0, 64) || 'Pending';
  const hasResult = value !== 'Pending';
  const panic = evaluatePanic({
    ...input,
    value,
    code: catalogItem.code,
    unit: String(input?.unit || catalogItem.unit || '')
  });
  return {
    code: catalogItem.code,
    name: catalogItem.name,
    value,
    unit: catalogItem.unit || '',
    reference: catalogItem.reference || '',
    status: hasResult && RESULT_STATUSES.has(input?.status) ? input.status : 'Pending',
    method: String(input?.method || 'Automated Analyzer').slice(0, 128),
    isPanic: Boolean(panic?.isPanic),
    panicSource: panic?.source
  };
}

module.exports = { normalizeNewOrderTest, normalizeEnteredResult };
