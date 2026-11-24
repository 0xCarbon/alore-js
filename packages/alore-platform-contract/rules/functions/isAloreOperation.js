'use strict';
exports.isAloreOperation = function isAloreOperation(operation) {
  return Boolean(
    operation &&
      ((operation.tags || []).indexOf('x-alore') >= 0 || operation['x-upstream-equivalent']),
  );
};
