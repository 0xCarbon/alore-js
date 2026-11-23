'use strict';
// Spectral custom function: every non-2xx response of an x-alore operation is problem+json.
module.exports = function aloreProblemJson(operation) {
  const results = [];
  for (const [code, response] of Object.entries((operation && operation.responses) || {})) {
    if (/^[23]/.test(code)) continue;
    const content = response && response.content;
    if (!content || content['application/problem+json'] === undefined) {
      results.push({
        message: `response ${code} must be application/problem+json`,
        path: ['responses', code],
      });
    }
  }
  return results;
};
