import { describe, expect, it, vi } from 'vitest';

import type { ErrorHookFn, HookFn, RequestHandler } from '../types';
import { PathSegment } from './PathSegment';

const noop: RequestHandler = () => {};
const hook: HookFn = () => {};

describe('PathSegment.mergeFrom', () => {
    describe('обработчики (handlers)', () => {
        it('переносит обработчики из source в target', () => {
            const target = new PathSegment('api');
            const source = new PathSegment('api');
            source.assignHandler('GET', noop);
            source.assignHandler('POST', noop);

            target.mergeFrom(source);

            expect(target.hasHandler('GET')).toBe(true);
            expect(target.hasHandler('POST')).toBe(true);
        });

        it('сохраняет существующие обработчики target', () => {
            const target = new PathSegment('api');
            const getHandler: RequestHandler = vi.fn();
            target.assignHandler('GET', getHandler);

            const source = new PathSegment('api');
            source.assignHandler('POST', noop);

            target.mergeFrom(source);

            expect(target.getHandler('GET')).toBe(getHandler);
            expect(target.hasHandler('POST')).toBe(true);
        });

        it('бросает ошибку при конфликте обработчиков', () => {
            const target = new PathSegment('users');
            target.assignHandler('GET', noop);

            const source = new PathSegment('users');
            source.assignHandler('GET', noop);

            expect(() => target.mergeFrom(source)).toThrow('already exists');
        });

        it('бросает ошибку при конфликте до того, как что-либо изменится', () => {
            const target = new PathSegment('users');
            target.assignHandler('GET', noop);

            const source = new PathSegment('users');
            source.assignHandler('GET', noop);
            source.assignHandler('POST', noop);

            expect(() => target.mergeFrom(source)).toThrow();
            expect(target.hasHandler('POST')).toBe(false);
        });
    });

    describe('хуки (hooks)', () => {
        it('переносит хуки из source в target', () => {
            const target = new PathSegment('api');
            const source = new PathSegment('api');

            const hookFn = vi.fn();
            source.assignHook('onRequest', hookFn);

            target.mergeFrom(source);

            expect(target.getHooks('onRequest')).toContain(hookFn);
        });

        it('дописывает хуки, а не заменяет', () => {
            const target = new PathSegment('api');
            const targetHook = vi.fn();
            target.assignHook('preHandler', targetHook);

            const source = new PathSegment('api');
            const sourceHook = vi.fn();
            source.assignHook('preHandler', sourceHook);

            target.mergeFrom(source);

            const hooks = target.getHooks('preHandler');
            expect(hooks).toContain(targetHook);
            expect(hooks).toContain(sourceHook);
            expect(hooks.length).toBe(2);
        });

        it('переносит onError хуки', () => {
            const target = new PathSegment('api');
            const source = new PathSegment('api');

            const errorHook: ErrorHookFn = vi.fn();
            source.assignHook('onError', errorHook);

            target.mergeFrom(source);

            expect(target.getHooks('onError')).toContain(errorHook);
        });

        it('переносит хуки всех типов', () => {
            const target = new PathSegment('api');
            const source = new PathSegment('api');

            const hooks = {
                onRequest: vi.fn(),
                preHandler: vi.fn(),
                postHandler: vi.fn(),
                onResponse: vi.fn(),
                onError: vi.fn() as unknown as ErrorHookFn,
            };

            source.assignHook('onRequest', hooks.onRequest);
            source.assignHook('preHandler', hooks.preHandler);
            source.assignHook('postHandler', hooks.postHandler);
            source.assignHook('onResponse', hooks.onResponse);
            source.assignHook('onError', hooks.onError);

            target.mergeFrom(source);

            expect(target.getHooks('onRequest')).toContain(hooks.onRequest);
            expect(target.getHooks('preHandler')).toContain(hooks.preHandler);
            expect(target.getHooks('postHandler')).toContain(hooks.postHandler);
            expect(target.getHooks('onResponse')).toContain(hooks.onResponse);
            expect(target.getHooks('onError')).toContain(hooks.onError);
        });
    });

    describe('статические дети', () => {
        it('переносит статических детей из source', () => {
            const target = new PathSegment('api');
            const source = new PathSegment('api');
            const child = source.createChild('users');
            child.assignHandler('GET', noop);

            target.mergeFrom(source);

            const merged = target.getChild('users');
            expect(merged).not.toBeNull();
            expect(merged!.hasHandler('GET')).toBe(true);
        });

        it('мерджит совпадающих статических детей рекурсивно', () => {
            const target = new PathSegment('api');
            const targetUsers = target.createChild('users');
            targetUsers.assignHandler('GET', noop);

            const source = new PathSegment('api');
            const sourceUsers = source.createChild('users');
            sourceUsers.assignHandler('POST', noop);

            target.mergeFrom(source);

            const users = target.getChild('users')!;
            expect(users.hasHandler('GET')).toBe(true);
            expect(users.hasHandler('POST')).toBe(true);
        });

        it('не затрагивает несвязанных детей target', () => {
            const target = new PathSegment('api');
            target.createChild('health').assignHandler('GET', noop);

            const source = new PathSegment('api');
            source.createChild('users').assignHandler('GET', noop);

            target.mergeFrom(source);

            expect(target.getChild('health')!.hasHandler('GET')).toBe(true);
            expect(target.getChild('users')!.hasHandler('GET')).toBe(true);
        });

        it('бросает ошибку при конфликте обработчиков в дочерних узлах', () => {
            const target = new PathSegment('api');
            target.createChild('users').assignHandler('GET', noop);

            const source = new PathSegment('api');
            source.createChild('users').assignHandler('GET', noop);

            expect(() => target.mergeFrom(source)).toThrow('already exists');
        });
    });

    describe('параметрические дети', () => {
        it('переносит paramChild из source', () => {
            const target = new PathSegment('users');
            const source = new PathSegment('users');
            const param = source.createChild(':id');
            param.assignHandler('GET', noop);

            target.mergeFrom(source);

            const merged = target.getChild(':id');
            expect(merged).not.toBeNull();
            expect(merged!.paramName).toBe('id');
            expect(merged!.hasHandler('GET')).toBe(true);
        });

        it('мерджит paramChild при совпадении имён', () => {
            const target = new PathSegment('users');
            target.createChild(':id').assignHandler('GET', noop);

            const source = new PathSegment('users');
            source.createChild(':id').assignHandler('DELETE', noop);

            target.mergeFrom(source);

            const param = target.getChild(':id')!;
            expect(param.hasHandler('GET')).toBe(true);
            expect(param.hasHandler('DELETE')).toBe(true);
        });

        it('бросает ошибку при конфликте имён параметров', () => {
            const target = new PathSegment('items');
            target.createChild(':itemId');

            const source = new PathSegment('items');
            source.createChild(':id');

            expect(() => target.mergeFrom(source)).toThrow('param conflict');
        });
    });

    describe('wildcard дети', () => {
        it('переносит wildcardChild из source', () => {
            const target = new PathSegment('files');
            const source = new PathSegment('files');
            source.createChild('*').assignHandler('GET', noop);

            target.mergeFrom(source);

            const wildcard = target.getChild('*');
            expect(wildcard).not.toBeNull();
            expect(wildcard!.hasHandler('GET')).toBe(true);
        });

        it('мерджит wildcardChild если оба существуют', () => {
            const target = new PathSegment('files');
            target.createChild('*').assignHandler('GET', noop);

            const source = new PathSegment('files');
            source.createChild('*').assignHandler('POST', noop);

            target.mergeFrom(source);

            const wildcard = target.getChild('*')!;
            expect(wildcard.hasHandler('GET')).toBe(true);
            expect(wildcard.hasHandler('POST')).toBe(true);
        });
    });

    describe('глубокий мердж', () => {
        it('мерджит деревья глубиной 3+', () => {
            const target = new PathSegment('');
            const api = target.createChild('api');
            const v1 = api.createChild('v1');
            v1.createChild('users').assignHandler('GET', noop);

            const source = new PathSegment('');
            const srcApi = source.createChild('api');
            const srcV1 = srcApi.createChild('v1');
            srcV1.createChild('posts').assignHandler('GET', noop);

            target.mergeFrom(source);

            expect(
                target
                    .getChild('api')!
                    .getChild('v1')!
                    .getChild('users')!
                    .hasHandler('GET')
            ).toBe(true);
            expect(
                target
                    .getChild('api')!
                    .getChild('v1')!
                    .getChild('posts')!
                    .hasHandler('GET')
            ).toBe(true);
        });
    });

    describe('пустой source', () => {
        it('ничего не ломает при пустом source', () => {
            const target = new PathSegment('api');
            target.assignHandler('GET', noop);
            target.assignHook('onRequest', hook);

            const source = new PathSegment('api');

            target.mergeFrom(source);

            expect(target.hasHandler('GET')).toBe(true);
            expect(target.getHooks('onRequest')).toContain(hook);
        });
    });
});

describe('PathSegment.adoptChild', () => {
    it('добавляет нового ребёнка если такого нет', () => {
        const parent = new PathSegment('api');
        const child = new PathSegment('users');
        child.assignHandler('GET', noop);

        parent.adoptChild(child);

        const adopted = parent.getChild('users');
        expect(adopted).not.toBeNull();
        expect(adopted!.hasHandler('GET')).toBe(true);
    });

    it('мерджит в существующего ребёнка при совпадении сегмента', () => {
        const parent = new PathSegment('api');
        parent.createChild('users').assignHandler('GET', noop);

        const child = new PathSegment('users');
        child.assignHandler('POST', noop);

        parent.adoptChild(child);

        const users = parent.getChild('users')!;
        expect(users.hasHandler('GET')).toBe(true);
        expect(users.hasHandler('POST')).toBe(true);
    });

    it('бросает ошибку при конфликте обработчиков при мердже', () => {
        const parent = new PathSegment('api');
        parent.createChild('users').assignHandler('GET', noop);

        const child = new PathSegment('users');
        child.assignHandler('GET', noop);

        expect(() => parent.adoptChild(child)).toThrow('already exists');
    });

    it('мерджит дочерние деревья при adoptChild', () => {
        const parent = new PathSegment('api');
        const existing = parent.createChild('v1');
        existing.createChild('health').assignHandler('GET', noop);

        const child = new PathSegment('v1');
        child.createChild('users').assignHandler('GET', noop);

        parent.adoptChild(child);

        const v1 = parent.getChild('v1')!;
        expect(v1.getChild('health')!.hasHandler('GET')).toBe(true);
        expect(v1.getChild('users')!.hasHandler('GET')).toBe(true);
    });

    it('переносит хуки ребёнка при мердже', () => {
        const parent = new PathSegment('api');
        parent.createChild('users');

        const child = new PathSegment('users');
        const hookFn = vi.fn();
        child.assignHook('onRequest', hookFn);

        parent.adoptChild(child);

        expect(parent.getChild('users')!.getHooks('onRequest')).toContain(hookFn);
    });
});
