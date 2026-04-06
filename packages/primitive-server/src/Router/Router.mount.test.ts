import { describe, expect, it, vi } from 'vitest';

import type { RequestHandler } from '../types';
import { Router } from './Router';

const noop: RequestHandler = () => {};

describe('Router.mount', () => {
    describe('child с пустым prefix (new Router())', () => {
        it('мерджит маршруты child в mountPoint', () => {
            const app = new Router();
            const child = new Router();
            child.get('/users', noop);
            child.get('/posts', noop);

            app.mount('/api', child);

            const api = app.root.getChild('api')!;
            expect(api).not.toBeNull();
            expect(api.getChild('users')!.hasHandler('GET')).toBe(true);
            expect(api.getChild('posts')!.hasHandler('GET')).toBe(true);
        });

        it('мерджит вложенные маршруты с параметрами', () => {
            const app = new Router();
            const child = new Router();
            child.get('/users/:id', noop);

            app.mount('/api', child);

            const users = app.root.getChild('api')!.getChild('users')!;
            const paramChild = users.getChild(':id');
            expect(paramChild).not.toBeNull();
            expect(paramChild!.paramName).toBe('id');
            expect(paramChild!.hasHandler('GET')).toBe(true);
        });

        it('мерджит хуки child.root в mountPoint', () => {
            const app = new Router();
            const child = new Router();
            const hookFn = vi.fn();

            child.get('/users', noop);
            child.assignGlobalHook('onRequest', hookFn);

            app.mount('/api', child);

            const api = app.root.getChild('api')!;
            expect(api.getHooks('onRequest')).toContain(hookFn);
        });

        it('мерджит хуки на вложенных сегментах', () => {
            const app = new Router();
            const child = new Router();
            const hookFn = vi.fn();

            child.get('/users', noop);
            child.assignHook('preHandler', '/users', hookFn);

            app.mount('/api', child);

            const users = app.root.getChild('api')!.getChild('users')!;
            expect(users.getHooks('preHandler')).toContain(hookFn);
        });

        it('мерджит обработчики child.root в mountPoint (обработчики на /)', () => {
            const app = new Router();
            const child = new Router();
            child.addRoute('GET', '/', noop);

            app.mount('/api', child);

            const api = app.root.getChild('api')!;
            expect(api.hasHandler('GET')).toBe(true);
        });

        it('бросает ошибку при конфликте обработчиков на одном узле', () => {
            const app = new Router();
            app.get('/api/users', noop);

            const child = new Router();
            child.get('/users', noop);

            expect(() => app.mount('/api', child)).toThrow();
        });

        it('разрешает разные методы на одном узле', () => {
            const app = new Router();
            app.get('/api/users', noop);

            const child = new Router();
            child.post('/users', noop);

            expect(() => app.mount('/api', child)).not.toThrow();

            const users = app.root.getChild('api')!.getChild('users')!;
            expect(users.hasHandler('GET')).toBe(true);
            expect(users.hasHandler('POST')).toBe(true);
        });

        it('мерджит wildcard-ребёнка', () => {
            const app = new Router();
            const child = new Router();
            child.get('/files/*', noop);

            app.mount('/api', child);

            const files = app.root.getChild('api')!.getChild('files')!;
            const wildcard = files.getChild('*');
            expect(wildcard).not.toBeNull();
            expect(wildcard!.hasHandler('GET')).toBe(true);
        });

        it('бросает ошибку при конфликте имён параметров', () => {
            const app = new Router();
            app.get('/api/items/:itemId', noop);

            const child = new Router();
            child.get('/items/:id', noop);

            expect(() => app.mount('/api', child)).toThrow();
        });

        it('мерджит при совпадении имён параметров', () => {
            const app = new Router();
            app.get('/api/items/:id', noop);

            const child = new Router();
            child.post('/items/:id', noop);

            expect(() => app.mount('/api', child)).not.toThrow();

            const id = app.root.getChild('api')!.getChild('items')!.getChild(':id')!;
            expect(id.hasHandler('GET')).toBe(true);
            expect(id.hasHandler('POST')).toBe(true);
        });
    });

    describe('child с непустым prefix (new Router("/v1"))', () => {
        it('добавляет child.root как статического ребёнка mountPoint', () => {
            const app = new Router();
            const child = new Router('/v1');
            child.get('/users', noop);

            app.mount('/api', child);

            const v1 = app.root.getChild('api')!.getChild('v1')!;
            expect(v1).not.toBeNull();
            expect(v1.getChild('users')!.hasHandler('GET')).toBe(true);
        });

        it('мерджит, если узел с таким сегментом уже существует', () => {
            const app = new Router();
            app.get('/api/v1/health', noop);

            const child = new Router('/v1');
            child.get('/users', noop);

            app.mount('/api', child);

            const v1 = app.root.getChild('api')!.getChild('v1')!;
            expect(v1.getChild('health')!.hasHandler('GET')).toBe(true);
            expect(v1.getChild('users')!.hasHandler('GET')).toBe(true);
        });

        it('бросает ошибку при конфликте обработчиков при мердже с существующим узлом', () => {
            const app = new Router();
            app.get('/api/v1/users', noop);

            const child = new Router('/v1');
            child.get('/users', noop);

            expect(() => app.mount('/api', child)).toThrow();
        });
    });

    describe('mount на корень "/"', () => {
        it('мерджит child прямо в root', () => {
            const app = new Router();
            const child = new Router();
            child.get('/users', noop);

            app.mount('/', child);

            expect(app.root.getChild('users')!.hasHandler('GET')).toBe(true);
        });
    });

    describe('множественный mount', () => {
        it('монтирует несколько роутеров на один prefix', () => {
            const app = new Router();

            const usersRouter = new Router();
            usersRouter.get('/users', noop);

            const postsRouter = new Router();
            postsRouter.get('/posts', noop);

            app.mount('/api', usersRouter);
            app.mount('/api', postsRouter);

            const api = app.root.getChild('api')!;
            expect(api.getChild('users')!.hasHandler('GET')).toBe(true);
            expect(api.getChild('posts')!.hasHandler('GET')).toBe(true);
        });

        it('монтирует на разные prefixes', () => {
            const app = new Router();

            const v1 = new Router();
            v1.get('/users', noop);

            const v2 = new Router();
            v2.get('/users', noop);

            app.mount('/api/v1', v1);
            app.mount('/api/v2', v2);

            const api = app.root.getChild('api')!;
            expect(api.getChild('v1')!.getChild('users')!.hasHandler('GET')).toBe(true);
            expect(api.getChild('v2')!.getChild('users')!.hasHandler('GET')).toBe(true);
        });

        it('правильно монтирует рядом  с wildcard', () => {
            const app = new Router();
            app.get('*', noop);

            const uselessRouter = new Router('');
            uselessRouter.post('useless', noop);

            app.mount('/', uselessRouter);

            app.compile();

            expect(app.lookup('/useless').found).toBe(true);
            expect(app.lookup('/useless').handlers?.POST).toBeTypeOf('function');
            expect(Boolean(app.lookup('/useless').handlers?.GET)).toBe(false);

            expect(app.lookup('/use').found).toBe(true);
            expect(app.lookup('/use').handlers?.GET).toBeTypeOf('function');
            expect(Boolean(app.lookup('/use').handlers?.POST)).toBe(false);
        });
    });

    describe('валидация prefix конструктора Router', () => {
        it('принимает пустую строку', () => {
            expect(() => new Router('')).not.toThrow();
        });

        it('принимает статический сегмент', () => {
            expect(() => new Router('/api')).not.toThrow();
            expect(() => new Router('/v1')).not.toThrow();
            expect(() => new Router('/my-router')).not.toThrow();
            expect(() => new Router('/my_router')).not.toThrow();
        });

        it('бросает ошибку на параметрический prefix', () => {
            expect(() => new Router(':id')).toThrow();
        });

        it('бросает ошибку на wildcard prefix', () => {
            expect(() => new Router('*')).toThrow();
        });

        it('бросает ошибку на prefix с несколькими сегментами', () => {
            expect(() => new Router('api/v1')).toThrow();
            expect(() => new Router('/api/v1')).toThrow();
        });
    });
});
