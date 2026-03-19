import type {
    ErrorHookFn,
    HookFn,
    HttpMethod,
    PathSegmentHooksStore,
    RequestHandler,
    RouteHookType,
} from '../types';
import { AllHttpMethods, AllRouteHookTypes, SegmentType } from '../types';
import { HandlerStore } from './HandlerStore';
import { SegmentMap } from './SegmentMap';

/**
 * Класс, описывающий сегмент URL. Экземпляры хранятся в Radix-Tree роутере.
 * Под сегментом подразумевается то, что находится между слэшами в URI,
 * т.е. www.domenname.com/segment/segment/segment
 *
 * @export
 * @class PathSegment
 */
export class PathSegment {
    readonly segment: string;
    readonly segmentType: SegmentType;

    private readonly staticChildren: SegmentMap;
    private paramChild: PathSegment | null = null;
    private wildcardChild: PathSegment | null = null;

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
     * @type {PathSegmentHooksStore}
     */
    private readonly assignedHooks: PathSegmentHooksStore;

    /**
     * Хуки, собранные со всех сегментов пути, включая данный.
     * Т.е., если у нас данный сегмент - это posts, который находится по пути
     * /api/users/:id/posts, то в compiledHooks попадаются сначала хуки из /api, затем из
     * /users, затем из /:id, и наконец из assignedHooks. Все функции так или иначе хранятся ссылками,
     * поэтому overhead из за дубликации указателей несущественный.
     *
     * @private
     * @type {(PathSegmentHooksStore | null)}
     */
    private compiledHooks: PathSegmentHooksStore | null = null;

    /**
     * Заменено на HandlersStore, чтобы при lookUp не тратилось время на вычисление хэшей
     *
     * @readonly
     * @type {HandlerStore}
     */
    readonly handlers: HandlerStore;

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

        this.staticChildren = new SegmentMap();

        this.assignedHooks = {
            onRequest: [],
            preHandler: [],
            postHandler: [],
            onResponse: [],
            onError: [],
        };

        this.handlers = new HandlerStore();
    }

    /**
     * только для мерджа
     *
     * @param segment
     * @returns
     */
    getChild(segment: string): PathSegment | null {
        if (segment === '*') {
            return this.wildcardChild;
        } else if (segment[0] === ':') {
            return this.paramChild;
        } else {
            return this.staticChildren.get(segment) ?? null;
        }
    }

    getStaticChildByRange(
        source: string,
        start: number,
        end: number
    ): PathSegment | null {
        return this.staticChildren.getByRange(source, start, end);
    }

    getParamChild(): PathSegment | null {
        return this.paramChild;
    }

    getWildcardChild(): PathSegment | null {
        return this.wildcardChild;
    }

    getAllChildren(): PathSegment[] {
        const result: PathSegment[] = [];

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

    createChild(segment: string): PathSegment {
        const child = new PathSegment(segment);

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
     * @param {(HookFn | ErrorHookFn)} fn
     */
    assignHook(type: 'onError', fn: ErrorHookFn): void;
    assignHook(type: Exclude<RouteHookType, 'onError'>, fn: HookFn): void;
    assignHook(type: RouteHookType, fn: HookFn | ErrorHookFn): void {
        (this.assignedHooks[type] as (HookFn | ErrorHookFn)[]).push(fn);
    }

    getHooks<T extends RouteHookType>(
        type: T
    ): T extends 'onError' ? ReadonlyArray<ErrorHookFn> : ReadonlyArray<HookFn> {
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

    getHandler(method: HttpMethod): RequestHandler | null {
        return this.handlers.get(method);
    }

    assignHandler(method: HttpMethod, handler: RequestHandler): void {
        if (this.handlers.has(method)) {
            console.warn(
                `Handler function has been replaced for ${method} method of ${this.segment}`
            );
        }

        this.handlers.set(method, handler);
    }

    setCompiledHooks(hooks: PathSegmentHooksStore) {
        this.compiledHooks = hooks;
    }

    getCompiledHooks(): PathSegmentHooksStore | null {
        return this.compiledHooks;
    }

    /**
     * Мерджит содержимое source в this.
     * Нужно для вкладывания роутеров друг в друга.
     */
    mergeFrom(source: PathSegment): void {
        const stack: Array<{ target: PathSegment; source: PathSegment }> = [
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
                    | HookFn
                    | ErrorHookFn
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
    adoptChild(child: PathSegment): void {
        const existing = this.staticChildren.get(child.segment);

        if (existing) {
            existing.mergeFrom(child);
        } else {
            this.staticChildren.set(child.segment, child);
        }
    }
}
