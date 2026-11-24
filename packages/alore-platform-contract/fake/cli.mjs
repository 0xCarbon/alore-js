#!/usr/bin/env node
// Start the fake Alore on loopback for specs that run it as a process (Joori, crawler, ui-lab).
//   alore-fake --port 4010 --feature files.status --webhook-url http://127.0.0.1:3000/webhooks/alore/v1
// The webhook secret is read from the environment variable named by --webhook-secret-env, never
// from argv. It defaults to a published fake secret. The first stdout line is `listening <baseURL>`.
import { parseArgs } from 'node:util';

import { createFake } from './fake.mjs';

const { values } = parseArgs({
  options: {
    port: { type: 'string', default: '0' },
    host: { type: 'string', default: '127.0.0.1' },
    feature: { type: 'string', multiple: true, default: [] },
    client: { type: 'string' },
    'org-ref': { type: 'string' },
    'webhook-url': { type: 'string' },
    'webhook-secret-env': { type: 'string' },
  },
});

const secret = values['webhook-secret-env'] ? process.env[values['webhook-secret-env']] : undefined;
if (values['webhook-secret-env'] && !secret) {
  console.error(`environment variable ${values['webhook-secret-env']} is empty`);
  process.exit(2);
}

const fake = createFake({
  features: values.feature,
  client: values.client,
  orgRef: values['org-ref'],
  webhookUrl: values['webhook-url'],
  webhookSecret: secret,
});
const { baseURL } = await fake.listen({ port: Number(values.port), host: values.host });
console.log(`listening ${baseURL}`);

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => void fake.close().then(() => process.exit(0)));
}
