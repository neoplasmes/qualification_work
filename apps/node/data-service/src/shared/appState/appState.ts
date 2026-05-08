import type { RequestHandler } from 'primitive-server';

// data-service does not parse cookies - auth is resolved at the gateway
// and forwarded via the X-Internal-Auth header.
export type InternalAuth = {
    userId: string;
    // TODO: extend once the X-Internal-Auth format from apps/go/auth is finalized
};

export type AppState = {
    internalAuth?: InternalAuth;
};

export type RequestHandlerType = RequestHandler<AppState>;
