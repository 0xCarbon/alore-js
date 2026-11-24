// The contract as the fake sees it. Everything here is read from the package's own published
// files (openapi/openapi.yaml, schemas/, fixtures/, package.json); the fake restates none of it.
import addFormats from 'ajv-formats';
import Ajv2020 from 'ajv/dist/2020.js';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

export const PKG_ROOT = fileURLToPath(new URL('..', import.meta.url));
const ROOT_ID = 'urn:alore:openapi';
const METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];

/** A body the contract rejects. `errors` holds the Ajv errors. */
export class ContractViolationError extends Error {
  constructor(what, errors) {
    super(`${what} does not conform to the contract: ${JSON.stringify(errors)}`);
    this.name = 'ContractViolationError';
    this.errors = errors;
  }
}

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));

function walkJson(dir, base = dir) {
  return readdirSync(dir)
    .sort()
    .flatMap((name) => {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) return walkJson(full, base);
      return name.endsWith('.json') ? [[full.slice(base.length + 1), readJson(full)]] : [];
    });
}

/**
 * OpenAPI 3.0's `nullable: true` without a `type` (the pinned upstream spec uses it beside a $ref or
 * as the second member of an allOf) is not valid JSON Schema, and Ajv rejects it. Rewrite it into
 * the equivalent `anyOf [.., {type: null}]`, in place, before the schemas are compiled.
 */
function nullableToJsonSchema(node) {
  if (Array.isArray(node)) {
    node.forEach(nullableToJsonSchema);
    return;
  }
  if (!node || typeof node !== 'object') return;
  Object.values(node).forEach(nullableToJsonSchema);
  if (node.nullable !== true || node.type !== undefined) return;
  const { nullable, allOf, ...rest } = node;
  const required = allOf?.filter((m) => !(Object.keys(m).length === 1 && m.nullable === true));
  const inner = { ...rest, ...(required?.length ? { allOf: required } : {}) };
  for (const key of Object.keys(node)) delete node[key];
  node.anyOf = [inner, { type: 'null' }];
}

const escapePointer = (segment) => segment.replaceAll('~', '~0').replaceAll('/', '~1');

function pathRegex(template) {
  const source = template
    .split('/')
    .map((part) =>
      /^\{[^}]+\}$/.test(part) ? '([^/]+)' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    )
    .join('/');
  return new RegExp(`^${source}$`);
}

/** Load the contract once: operations, validators and fixtures. */
export function loadFakeContract(root = PKG_ROOT) {
  const version = readJson(join(root, 'package.json')).version;
  const doc = parse(readFileSync(join(root, 'openapi', 'openapi.yaml'), 'utf8'), {
    maxAliasCount: -1,
  });
  nullableToJsonSchema(doc);
  const schemas = Object.fromEntries(walkJson(join(root, 'schemas')));
  const fixtures = Object.fromEntries(walkJson(join(root, 'fixtures')));

  // openapi.yaml references the Alore-owned schemas by relative path; inline them.
  for (const [name, schema] of Object.entries(doc.components.schemas)) {
    const ref = schema?.$ref;
    if (typeof ref === 'string' && ref.startsWith('../schemas/')) {
      const file = schemas[ref.slice('../schemas/'.length)];
      if (!file) throw new Error(`openapi.yaml references ${ref}, which is not in schemas/`);
      const { $schema, ...body } = file;
      doc.components.schemas[name] = body;
    }
  }

  const ajv = new Ajv2020({ strict: false, allErrors: true, logger: false });
  addFormats(ajv);
  ajv.addFormat('unixtime', { type: 'number', validate: Number.isInteger });
  for (const [name, schema] of Object.entries(schemas)) ajv.addSchema(schema, name);
  // The whole document is one root, so `#/components/...` references inside operations resolve.
  ajv.addSchema({ $id: ROOT_ID, ...doc }, ROOT_ID, undefined, false);

  const operations = [];
  for (const [path, item] of Object.entries(doc.paths)) {
    for (const method of METHODS.filter((m) => item[m])) {
      const op = item[method];
      operations.push({
        method: method.toUpperCase(),
        path,
        operationId: op.operationId,
        status: op['x-status'],
        regex: pathRegex(path),
        params: (path.match(/\{[^}]+\}/g) ?? []).length,
        op,
      });
    }
  }
  const byId = new Map(operations.map((o) => [o.operationId, o]));

  const deref = (node) => {
    let pointer = null;
    let current = node;
    while (current?.$ref) {
      pointer = current.$ref.slice(1);
      current = pointer
        .split('/')
        .slice(1)
        .reduce((n, k) => n?.[k.replaceAll('~1', '/')], doc);
    }
    return { node: current, pointer };
  };

  /** JSON pointer, inside the document, of the JSON body schema of an operation's response. */
  function responseSchemaPointer(operationId, status) {
    const entry = byId.get(operationId);
    if (!entry) throw new Error(`unknown operation ${operationId}`);
    const base = `/paths/${escapePointer(entry.path)}/${entry.method.toLowerCase()}/responses`;
    const declared = entry.op.responses?.[String(status)] ? String(status) : 'default';
    const response = entry.op.responses?.[declared];
    if (!response) return null;
    const { node, pointer } = deref(response);
    const at = pointer ?? `${base}/${declared}`;
    const media = Object.keys(node?.content ?? {}).find((m) => /json/.test(m));
    return media && node.content[media].schema
      ? `${at}/content/${escapePointer(media)}/schema`
      : null;
  }

  /** JSON pointer of the JSON (or multipart) request body schema of an operation; null when none. */
  function requestSchemaPointer(operationId) {
    const entry = byId.get(operationId);
    if (!entry) throw new Error(`unknown operation ${operationId}`);
    if (!entry.op.requestBody) return null;
    const base = `/paths/${escapePointer(entry.path)}/${entry.method.toLowerCase()}/requestBody`;
    const { node, pointer } = deref(entry.op.requestBody);
    const media = Object.keys(node?.content ?? {}).find((m) => /json|multipart/.test(m));
    return media && node.content[media].schema
      ? `${pointer ?? base}/content/${escapePointer(media)}/schema`
      : null;
  }

  function check(validate, value) {
    return validate(value) ? null : validate.errors;
  }

  const api = {
    version,
    doc,
    operations,
    fixtures,
    schemaNames: Object.keys(schemas),
    operation: (operationId) => byId.get(operationId),

    /** Operation for a request, static paths before parameter paths; undefined when none. */
    match(method, path) {
      return operations
        .filter((o) => o.method === method && o.regex.test(path))
        .sort((a, b) => a.params - b.params)[0];
    },

    /** Ajv errors, or null when the value conforms to schemas/<name>. */
    validateSchema(name, value) {
      const validate = ajv.getSchema(name);
      if (!validate) throw new Error(`unknown schema ${name}`);
      return check(validate, value);
    },
    assertSchema(name, value) {
      const errors = api.validateSchema(name, value);
      if (errors) throw new ContractViolationError(name, errors);
    },

    /** True when the operation declares a JSON body schema for this status (or `default`). */
    declaresResponse: (operationId, status) => responseSchemaPointer(operationId, status) !== null,

    /** Ajv errors, or null when the value conforms to the operation's JSON/multipart request schema. */
    validateRequest(operationId, value) {
      const pointer = requestSchemaPointer(operationId);
      return pointer ? check(ajv.getSchema(`${ROOT_ID}#${pointer}`), value) : null;
    },

    /** Ajv errors, or null when the body conforms to the operation's response schema. */
    validateResponse(operationId, status, value) {
      const pointer = responseSchemaPointer(operationId, status);
      if (!pointer) return [{ message: `${operationId} declares no JSON schema for ${status}` }];
      return check(ajv.getSchema(`${ROOT_ID}#${pointer}`), value);
    },
    assertResponse(operationId, status, value) {
      const errors = api.validateResponse(operationId, status, value);
      if (errors) throw new ContractViolationError(`${operationId} ${status}`, errors);
    },
  };
  return api;
}
