import type { RequestHandler } from 'primitive-server';

export type AuthState = {
    authenticated: boolean;
    userId: string | null;
};

export type AppState = {
    cookies: Record<string, string>;
    auth: AuthState;
};

export type RequestHandlerType = RequestHandler<AppState>;
