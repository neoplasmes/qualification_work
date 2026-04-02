import { describe, expectTypeOf, it } from 'vitest';

import { Application } from './Application';
import { Router } from './Router';

class AuthError extends Error {
    readonly code = 'mocked';
}

type AppState = { traceId?: string };

describe('Application error typing', () => {
    it('correctly handles user defined Error and state types', () => {
        const app = new Application<AppState, AuthError>();
        const router = new Router<AppState, AuthError>();

        app.onError((error, ctx) => {
            expectTypeOf(error).toEqualTypeOf<AuthError>();
            expectTypeOf(ctx.state).toEqualTypeOf<AppState>();
            expectTypeOf(error).toExtend<typeof AuthError.prototype>();
        });

        router.assignGlobalHook('onError', (error, ctx) => {
            expectTypeOf(error).toEqualTypeOf<AuthError>();
            expectTypeOf(ctx.state).toEqualTypeOf<AppState>();
        });

        app.get('/secure', () => {
            throw new AuthError('denied');
        });

        app.assignHook('onError', '/secure', (error, ctx) => {
            expectTypeOf(error).toEqualTypeOf<AuthError>();
            expectTypeOf(ctx.state).toEqualTypeOf<AppState>();
        });
    });
});
