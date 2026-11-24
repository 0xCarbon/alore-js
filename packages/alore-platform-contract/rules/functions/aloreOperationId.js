'use strict';
// Spectral custom function: every operation Alore defines (the x-alore tag, or an upstream route
// under a router spelling) has an operationId. Spectral's JSONPath filter expressions do not match
// here, so the function selects the operations itself.
const { isAloreOperation } = require('./isAloreOperation.js');

module.exports = function aloreOperationId(operation) {
  if (!isAloreOperation(operation) || operation.operationId) return [];
  return [{ message: 'an Alore-defined operation must have an operationId' }];
};
