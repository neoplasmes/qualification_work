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
export type RequestContext<T extends Record<string, unknown> = Record<string, unknown>> =
    Readonly<{
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
        state: T;
    }>;

/**
 * параметры из /:param
 */
export type RouteParams = Record<string, string>;

export type RequestHandler<T extends Record<string, unknown> = Record<string, unknown>> =
    (context: RequestContext<T>) => void | Promise<void>;

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

export type HookFn<T extends Record<string, unknown> = Record<string, unknown>> = (
    context: RequestContext<T>
) => void | Promise<void>;

export type ErrorHookFn<
    T extends Record<string, unknown> = Record<string, unknown>,
    E = unknown,
> = (err: E, context: RequestContext<T>) => void | Promise<void>;

export type LifecycleHookFn = () => void | Promise<void>;
/**
 * Объект со всеми собранными хуками для каждого PathSegment
 */
export type PathSegmentHooksStore<
    T extends Record<string, unknown> = Record<string, unknown>,
    E = unknown,
> = {
    [K in RouteHookType]: K extends 'onError' ? ErrorHookFn<T, E>[] : HookFn<T>[];
};

export type QueryParams = Record<string, string | string[]>;
