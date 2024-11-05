import { authService } from '.';

export type AuthInstance = Awaited<ReturnType<typeof authService>>;
