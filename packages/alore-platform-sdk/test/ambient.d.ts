declare module '@alore/platform-contract/fake' {
  export const API_PREFIX: string;
  export const CONTROL_PREFIX: string;
  export const SCENARIO_HEADER: string;
  export const DEFAULT_WEBHOOK_SECRET: string;
  export const SCENARIOS: Record<string, { type: string; detail: string; code?: string }>;

  export interface FakeRequestLog {
    seq: number;
    method: string;
    path: string;
    query: string;
    scenario: string | null;
    headers: Record<string, string>;
    body: unknown;
    status: number;
  }

  export interface FakeAloreServer {
    listen(opts?: { port?: number; host?: string }): Promise<{
      origin: string;
      baseURL: string;
      port: number;
    }>;
    close(): Promise<void>;
    reset(): void;
    flush(): Promise<void>;
    seedFile(opts?: {
      id?: string;
      filename?: string;
      bytes?: number;
      purpose?: string;
      status?: string;
    }): { id: string; filename: string; bytes: number; purpose: string; status: string };
    setFileStatus(id: string, status: string): Promise<Record<string, unknown>>;
    emit(type: string, opts?: Record<string, unknown>): Promise<Record<string, unknown>>;
    redeliver(eventId: string): Promise<void>;
    advance(ms: number): void;
    readonly requests: FakeRequestLog[];
    readonly events: Array<Record<string, unknown>>;
    readonly deliveries: Array<Record<string, unknown>>;
  }

  export function createFake(options?: Record<string, unknown>): FakeAloreServer;

  export function loadFakeContract(): {
    version: string;
    doc: {
      components: {
        schemas: {
          AloreProblem: { properties: { type: { enum: string[] } } };
          AloreFileExtension: { properties: { status: { enum: string[] } } };
        };
      };
    };
    fixtures: Record<string, { valid: boolean; schema?: string; instance: unknown }>;
  };

  export function signWebhook(args: {
    id: string;
    timestamp: number;
    body: string;
    secret: string;
  }): Record<string, string>;
}
