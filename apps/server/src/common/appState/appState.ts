import type { RequestHandler } from 'primitive-server';

export type AppState = {
    cookies: Record<string, string>;
};

export type RequestHandlerType = RequestHandler<AppState>;
