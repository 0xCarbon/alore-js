'use strict';
// Spectral custom function: every non-2xx response of an Alore-defined operation (x-alore tag or x-upstream-equivalent) is problem+json.
const { isAloreOperation } = require('./isAloreOperation.js');

module.exports = function aloreProblemJson(operation, _options, context) {
  const results = [];
  if (!isAloreOperation(operation)) return results;
  for (const [code, response] of Object.entries((operation && operation.responses) || {})) {
    if (/^[23]/.test(code)) continue;
    const content = response && response.content;
    if (!content || content['application/problem+json'] === undefined) {
      results.push({
        message: `response ${code} must be application/problem+json`,
        path: [...((context && context.path) || []), 'responses', code],
      });
    }
  }
  return results;
};
