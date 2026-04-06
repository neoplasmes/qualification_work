import {
    AllHttpMethods,
    AllRouteHookTypes,
    SegmentType,
    type ErrorHookFn,
    type HookFn,
    type HttpMethod,
    type PathSegmentHooksStore,
    type RequestHandler,
    type RouteHookType,
} from '../types';
import { HandlerStore } from './HandlerStore';

/**
 * An instance of this class corresponds to a segment of the path, e.g. for /api/users
 * there will be a PathSegment with segment = 'api', which has a static child with segment = 'users'.
 *
 * All segments are stored in a radix-tree structure (see router implementation).
 *
 * @export
 * @class PathSegment
 * @template {Record<string, unknown>} [T=Record<string, unknown>] - application state type
 * @template [E=unknown] - error type for onError hooks
 */
export class PathSegment<
    T extends Record<string, unknown> = Record<string, unknown>,
    E = unknown,
> {
    readonly segment: string;
    readonly segmentType: SegmentType;

    private readonly staticChildren: Map<string, PathSegment<T, E>>;
    private paramChild: PathSegment<T, E> | null = null;
    private wildcardChild: PathSegment<T, E> | null = null;

    /**
     * Не null, только если segmentType = PARAMETRIC
     *
     * @readonly
     * @type {(string | null)}
     */
    readonly paramName: string | null = null;

    /**
     * Хуки, которые назначены именно на данный сегмент пути.
     *
     * @private
     * @type {PathSegmentHooksStore<T>}
     */
    private readonly assignedHooks: PathSegmentHooksStore<T, E>;

    /**
     * Хуки, собранные со всех сегментов пути, включая данный.
     * Т.е., если у нас данный сегмент - это posts, который находится по пути
     * /api/users/:id/posts, то в compiledHooks попадаются сначала хуки из /api, затем из
     * /users, затем из /:id, и наконец из assignedHooks. Все функции так или иначе хранятся ссылками,
     * поэтому overhead из за дубликации указателей несущественный.
     *
     * @private
     * @type {(PathSegmentHooksStore<T> | null)}
     */
    private compiledHooks: PathSegmentHooksStore<T, E> | null = null;

    /**
     * Заменено на HandlersStore, чтобы при lookUp не тратилось время на вычисление хэшей
     *
     * @readonly
     * @type {HandlerStore<T>}
     */
    readonly handlers: HandlerStore<T>;

    constructor(segment: string) {
        this.segment = segment;

        if (segment === '*') {
            this.segmentType = SegmentType.WILDCARD;
        } else if (segment[0] === ':') {
            this.segmentType = SegmentType.PARAMETRIC;
            this.paramName = segment.slice(1);
        } else {
            this.segmentType = SegmentType.STATIC;
        }

        this.staticChildren = new Map();

        this.assignedHooks = {
            onRequest: [],
            preHandler: [],
            postHandler: [],
            onResponse: [],
            onError: [],
        };

        this.handlers = new HandlerStore<T>();
    }

    getChild(segment: string): PathSegment<T, E> | null {
        if (segment === '*') {
            return this.wildcardChild;
        } else if (segment[0] === ':') {
            return this.paramChild;
        } else {
            return this.staticChildren.get(segment) ?? null;
        }
    }

    getStaticChild(segment: string): PathSegment<T, E> | null {
        return this.staticChildren.get(segment) ?? null;
    }

    getParamChild(): PathSegment<T, E> | null {
        return this.paramChild;
    }

    getWildcardChild(): PathSegment<T, E> | null {
        return this.wildcardChild;
    }

    getAllChildren(): PathSegment<T, E>[] {
        const result: PathSegment<T, E>[] = [];

        this.staticChildren.forEach(value => {
            result.push(value);
        });

        if (this.paramChild) {
            result.push(this.paramChild);
        }

        if (this.wildcardChild) {
            result.push(this.wildcardChild);
        }

        return result;
    }

    createChild(segment: string): PathSegment<T, E> {
        const child = new PathSegment<T, E>(segment);

        if (child.segmentType === SegmentType.WILDCARD) {
            if (this.wildcardChild) {
                console.warn(
                    `wildcardChild of ${this.segment} has been overwritten with ${child.segment}`
                );
            }

            this.wildcardChild = child;
        } else if (child.segmentType === SegmentType.PARAMETRIC) {
            if (this.paramChild) {
                console.warn(
                    `paramChild ${this.paramChild.segment} of ${this.segment} has been overwritten with ${child.segment}`
                );
            }

            this.paramChild = child;
        } else {
            const oldStaticChild = this.staticChildren.get(segment);

            if (oldStaticChild) {
                console.warn(
                    `static child ${oldStaticChild.segment} of ${this.segment} has been overwritten by the new object`
                );
            }

            this.staticChildren.set(segment, child);
        }

        return child;
    }

    /**
     * Функция для добавления хука конкретно на данный PathSegment
     *
     * @param {RouteHookType} type
     * @param {(HookFn<T> | ErrorHookFn<T>)} fn
     */
    assignHook(type: 'onError', fn: ErrorHookFn<T, E>): void;
    assignHook(type: Exclude<RouteHookType, 'onError'>, fn: HookFn<T>): void;
    assignHook(type: RouteHookType, fn: HookFn<T> | ErrorHookFn<T, E>): void {
        (this.assignedHooks[type] as (HookFn<T> | ErrorHookFn<T, E>)[]).push(fn);
    }

    getHooks<K extends RouteHookType>(
        type: K
    ): K extends 'onError' ? ReadonlyArray<ErrorHookFn<T, E>> : ReadonlyArray<HookFn<T>> {
        return this.assignedHooks[type];
    }

    /**
     * Может ли узел принимать запросы
     *
     * @returns true - есть какие-то обработчики, false - нет
     */
    canHandle(): boolean {
        return this.handlers.hasAny();
    }

    hasHandler(method: HttpMethod): boolean {
        return this.handlers.has(method);
    }

    hasAssignedHooks(): boolean {
        return (
            Object.keys(this.assignedHooks) as (keyof typeof this.assignedHooks)[]
        ).reduce((acc, curr) => {
            return acc || this.assignedHooks[curr].length > 0;
        }, false);
    }

    getHandler(method: HttpMethod): RequestHandler<T> | null {
        return this.handlers.get(method);
    }

    assignHandler(method: HttpMethod, handler: RequestHandler<T>): void {
        if (this.handlers.has(method)) {
            console.warn(
                `Handler function has been replaced for ${method} method of ${this.segment}`
            );
        }

        this.handlers.set(method, handler);
    }

    setCompiledHooks(hooks: PathSegmentHooksStore<T, E>) {
        this.compiledHooks = hooks;
    }

    getCompiledHooks(): PathSegmentHooksStore<T, E> | null {
        return this.compiledHooks;
    }

    /**
     * Мерджит содержимое source в this.
     * Нужно для вкладывания роутеров друг в друга.
     */
    mergeFrom(source: PathSegment<T, E>): void {
        const stack: Array<{ target: PathSegment<T, E>; source: PathSegment<T, E> }> = [
            { target: this, source },
        ];

        while (stack.length > 0) {
            const { target, source } = stack.pop()!;

            // мердж хэндлеров
            for (const method of AllHttpMethods) {
                const handler = source.handlers.get(method);
                if (!handler) {
                    continue;
                }

                if (target.handlers.has(method)) {
                    throw new Error(
                        `${method} handler of "${source.segment}" already exists on "${target.segment}"`
                    );
                }

                target.handlers.set(method, handler);
            }

            // мердж хуков
            for (const hookType of AllRouteHookTypes) {
                const sourceHooks = source.assignedHooks[hookType];
                const targetHooks = target.assignedHooks[hookType] as (
                    | HookFn<T>
                    | ErrorHookFn<T, E>
                )[];

                for (const hook of sourceHooks) {
                    targetHooks.push(hook);
                }
            }

            // мердж статических детей
            for (const [s, sourceChild] of source.staticChildren) {
                const existing = target.staticChildren.get(s);

                // Если у целевого узла есть такой же ребёнок, как и у источника,
                // мы мерджим их свойства (хэндлеры, хуки, дети)
                if (existing) {
                    stack.push({ target: existing, source: sourceChild });
                } else {
                    target.staticChildren.set(s, sourceChild);
                }
            }

            // мердж параметров
            if (source.paramChild) {
                if (target.paramChild) {
                    // Если и у target и у source есть дети параметры
                    if (target.paramChild.segment !== source.paramChild.segment) {
                        // Но при этом называются они при этом по-разному -> бан
                        throw new Error(
                            `param conflict during mount: ` +
                                `existing "${target.paramChild.segment}" vs incoming "${source.paramChild.segment}"`
                        );
                    }
                    // Называются одинаково -> мердж
                    stack.push({ target: target.paramChild, source: source.paramChild });
                } else {
                    // иначе просто присваиваем
                    target.paramChild = source.paramChild;
                }
            }

            // мердж wildcard (*)
            if (source.wildcardChild) {
                if (target.wildcardChild) {
                    // У обоих есть -> мерджим
                    stack.push({
                        target: target.wildcardChild,
                        source: source.wildcardChild,
                    });
                } else {
                    // иначе просто присваиваем
                    target.wildcardChild = source.wildcardChild;
                }
            }
        }
    }

    /**
     * Усыновляет другой PathSegment как статического ребёнка.
     * Если ребёнок с таким сегментом уже есть - мерджит в него.
     */
    adoptChild(child: PathSegment<T, E>): void {
        const existing = this.staticChildren.get(child.segment);

        if (existing) {
            existing.mergeFrom(child);
        } else {
            this.staticChildren.set(child.segment, child);
        }
    }
}
