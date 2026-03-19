import { bench, describe } from 'vitest';
import { Router } from './Router';
import type { RequestHandler } from '../types';

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
        router.lookup('GET', '/health');
    });

    bench('static deep — /api/users/me/settings', () => {
        router.lookup('GET', '/api/users/me/settings');
    });

    bench('parametric — /api/users/:id', () => {
        router.lookup('GET', '/api/users/42');
    });

    bench('parametric deep — /api/posts/:id/comments/:commentId', () => {
        router.lookup('GET', '/api/posts/7/comments/99');
    });

    bench('wildcard — /static/*', () => {
        router.lookup('GET', '/static/js/app.bundle.min.js');
    });

    bench('not found', () => {
        router.lookup('GET', '/api/nonexistent/path');
    });
});
