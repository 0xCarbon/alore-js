import { METHODS } from './cut.mjs';

export const PROBLEM_MEDIA = 'application/problem+json';
export const PROBLEM_SCHEMA_REF = '#/components/schemas/AloreProblem';
export const isStandardError = (status) => /^[45](?:[0-9]{2}|XX)$/.test(status);

export function resolveResponse(doc, response) {
  const seen = new Set();
  while (response?.$ref) {
    const ref = response.$ref;
    const prefix = '#/components/responses/';
    if (!ref.startsWith(prefix) || seen.has(ref)) return undefined;
    seen.add(ref);
    const name = ref.slice(prefix.length).replaceAll('~1', '/').replaceAll('~0', '~');
    const { $ref, ...annotations } = response;
    const component = doc.components?.responses?.[name];
    if (!component) return undefined;
    response = { ...component, ...annotations };
  }
  return response;
}

/** Add the Alore wire format only to existing standard errors in the merged document. */
export function addStandardProblemResponses(doc) {
  for (const item of Object.values(doc.paths ?? {})) {
    for (const method of METHODS) {
      const responses = item[method]?.responses ?? {};
      for (const [status, declared] of Object.entries(responses)) {
        if (!isStandardError(status)) continue;
        const response = resolveResponse(doc, declared);
        if (!response || response.content?.[PROBLEM_MEDIA] !== undefined) continue;
        // Expand references at the operation so the original shared component stays intact.
        responses[status] = {
          ...response,
          content: {
            ...response.content,
            [PROBLEM_MEDIA]: { schema: { $ref: PROBLEM_SCHEMA_REF } },
          },
        };
      }
    }
  }
}
