import type { IncomingMessage, ServerResponse } from 'node:http';
import type { FRequest } from './FRequest';
import type { FResponse } from './FResponse';

/**
 * Все доступные HTTP методы
 */
export const AllHttpMethods = [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS',
    'HEAD',
] as const;

export type HttpMethod = (typeof AllHttpMethods)[number];

/**
 * Контекст запроса, передающийся между хуками и обработчиками
 */
export type RequestContext = Readonly<{
    /**
     * Обёртка фреймворка над запросом
     */
    request: FRequest;
    /**
     * Обёртка фреймворка над ответом сервера
     */
    response: FResponse;
    /**
     * Стейт, передающийся между хуками/хэндлерами и т.д.
     */
    state: Record<string, unknown>;
    /**
     * Оригинальный node:http объект, чтобы использовать какой-нибудь функционал,
     * которого нет в обёртке
     */
    rawRequest: IncomingMessage;
    /**
     * Оригинальный node:http объект, чтобы использовать какой-нибудь функционал,
     * которого нет в обёртке
     */
    rawResponse: ServerResponse;
}>;

/**
 * параметры из /:param
 */
export type RouteParams = Record<string, string>;

export type RequestHandler = (context: RequestContext) => void | Promise<void>;

export enum SegmentType {
    STATIC,
    PARAMETRIC,
    WILDCARD,
}

/**
 * Все доступные хуки маршрутов.
 */
export const AllRouteHookTypes = [
    'onRequest',
    'preHandler',
    'postHandler',
    'onResponse',
    'onError',
] as const;

export type RouteHookType = (typeof AllRouteHookTypes)[number];

/**
 * Все доступные глобальные хуки приложения.
 */
export const AllLifecycleHookTypes = ['onCompiled', 'onReady', 'onClose'] as const;

export type LifecycleHookType = (typeof AllLifecycleHookTypes)[number];

export const AllAppRequestHookTypes = ['onRequest', 'onResponse', 'onError'] as const;

export type AppRequestHookType = (typeof AllAppRequestHookTypes)[number];

export type HookFn = (context: RequestContext) => void | Promise<void>;

export type ErrorHookFn = (err: unknown, context: RequestContext) => void | Promise<void>;

export type LifecycleHookFn = () => void | Promise<void>;
/**
 * Объект со всеми собранными хуками для каждого PathSegment
 */
export type PathSegmentHooksStore = {
    [K in RouteHookType]: K extends 'onError' ? ErrorHookFn[] : HookFn[];
};

export type QueryParams = Record<string, string | string[]>;

/**
 * Хранилище хэндлеров для каждого HTTP метода.
 * Класс вместо Map, чтобы V8 создал стабильный hidden class
 * и обращался к свойствам по offset, а не через хеширование.
 */
export class HandlerStore {
    GET: RequestHandler | null = null;
    POST: RequestHandler | null = null;
    PUT: RequestHandler | null = null;
    PATCH: RequestHandler | null = null;
    DELETE: RequestHandler | null = null;
    OPTIONS: RequestHandler | null = null;
    HEAD: RequestHandler | null = null;

    get(method: HttpMethod): RequestHandler | null {
        return this[method];
    }

    set(method: HttpMethod, handler: RequestHandler): void {
        this[method] = handler;
    }

    has(method: HttpMethod): boolean {
        return this[method] !== null;
    }

    /**
     * Строка для заголовка Allow, например "GET, POST, OPTIONS"
     */
    allowHeader(): string {
        let result = '';
        if (this.GET !== null) {
            result += 'GET, ';
        }
        if (this.POST !== null) {
            result += 'POST, ';
        }
        if (this.PUT !== null) {
            result += 'PUT, ';
        }
        if (this.PATCH !== null) {
            result += 'PATCH, ';
        }
        if (this.DELETE !== null) {
            result += 'DELETE, ';
        }
        if (this.HEAD !== null) {
            result += 'HEAD, ';
        }
        result += 'OPTIONS';
        return result;
    }

    /**
     * Есть ли хотя бы один хэндлер
     */
    hasAny(): boolean {
        return (
            this.GET !== null ||
            this.POST !== null ||
            this.PUT !== null ||
            this.PATCH !== null ||
            this.DELETE !== null ||
            this.OPTIONS !== null ||
            this.HEAD !== null
        );
    }
}
