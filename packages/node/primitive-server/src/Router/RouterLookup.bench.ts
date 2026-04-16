import { bench, describe } from 'vitest';

import type { RequestHandler } from '../types';
import { Router } from './Router';

const noop: RequestHandler = () => {};

function createRouter(): Router {
    const router = new Router();

    // статические маршруты
    router.get('/health', noop);
    router.get('/api/users', noop);
    router.post('/api/users', noop);
    router.get('/api/users/me/settings', noop);
    router.get('/api/posts', noop);
    router.post('/api/posts', noop);

    // параметрические
    router.get('/api/users/:id', noop);
    router.get('/api/users/:id/posts', noop);
    router.get('/api/posts/:id', noop);
    router.get('/api/posts/:id/comments/:commentId', noop);

    // wildcard
    router.get('/static/*', noop);

    router.compile();

    return router;
}

const router = createRouter();

describe('Router.lookup', () => {
    bench('static short — /health', () => {
        router.lookup('/health');
    });

    bench('static deep — /api/users/me/settings', () => {
        router.lookup('/api/users/me/settings');
    });

    bench('parametric — /api/users/:id', () => {
        router.lookup('/api/users/42');
    });

    bench('parametric deep — /api/posts/:id/comments/:commentId', () => {
        router.lookup('/api/posts/7/comments/99');
    });

    bench('wildcard — /static/*', () => {
        router.lookup('/static/js/app.bundle.min.js');
    });

    bench('not found', () => {
        router.lookup('/api/nonexistent/path');
    });
});
