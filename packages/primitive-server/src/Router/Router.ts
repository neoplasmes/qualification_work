import assert from 'node:assert';
import { PathSegment } from '../PathSegment';
import type {
    ErrorHookFn,
    HookFn,
    HttpMethod,
    PathSegmentHooksStore,
    RequestHandler,
    RouteHookType,
    RouteParams,
} from '../types';
import type { HandlerStore } from '../PathSegment';
import { parsePath } from '../utils';

export type LookupResult<T extends Record<string, unknown> = Record<string, unknown>> = {
    found: boolean;
    handlers: HandlerStore<T> | null;
    params: RouteParams;
    hooks: PathSegmentHooksStore<T> | null;
};

export class Router<T extends Record<string, unknown> = Record<string, unknown>> {
    readonly root: PathSegment<T>;

    private isCompiled: boolean = false;

    /**
     * Creates an instance of Router.
     *
     * @constructor
     * @param {string} [prefix='']
     */
    constructor(prefix: string = '') {
        assert(
            prefix === '' || /^[a-zA-Z0-9_-]+$/.test(prefix),
            `Router prefix must be a static segment, but got "${prefix}"`
        );

        this.root = new PathSegment<T>(prefix);
    }

    addRoute(method: HttpMethod, path: string, handler: RequestHandler<T>): void {
        this.ensureNotCompiled();

        const segments = parsePath(path);

        let curr: PathSegment<T> = this.root;
        for (const s of segments) {
            curr = curr.getChild(s) ?? curr.createChild(s);
        }

        curr.assignHandler(method, handler);
    }

    get(path: string, handler: RequestHandler<T>): void {
        this.addRoute('GET', path, handler);
    }

    post(path: string, handler: RequestHandler<T>): void {
        this.addRoute('POST', path, handler);
    }

    put(path: string, handler: RequestHandler<T>): void {
        this.addRoute('PUT', path, handler);
    }

    patch(path: string, handler: RequestHandler<T>): void {
        this.addRoute('PATCH', path, handler);
    }

    delete(path: string, handler: RequestHandler<T>): void {
        this.addRoute('DELETE', path, handler);
    }

    /**
     * Функция для добавления хука конкретно на данный PathSegment
     *
     * @param {RouteHookType} type
     * @param {(HookFn<T> | ErrorHookFn<T>)} fn
     */
    assignHook(type: 'onError', path: string, fn: ErrorHookFn<T>): void;
    assignHook(
        type: Exclude<RouteHookType, 'onError'>,
        path: string,
        fn: HookFn<T>
    ): void;
    assignHook(type: RouteHookType, path: string, fn: HookFn<T> | ErrorHookFn<T>): void {
        this.ensureNotCompiled();

        const segments = parsePath(path);

        let curr: PathSegment<T> = this.root;
        for (const s of segments) {
            const next = curr.getChild(s);

            assert(next !== null, `The segment ${s} is not presented in the router tree`);

            curr = next;
        }

        // boilerplate из-за typescript
        if (type === 'onError') {
            curr.assignHook(type, fn as ErrorHookFn<T>);
        } else {
            curr.assignHook(type, fn as HookFn<T>);
        }
    }

    /**
     * Добавить хук на корневой элемент роутера, чтобы хук применялся вообще ко всем маршрутам
     *
     * @param {RouteHookType} type
     * @param {(HookFn<T> | ErrorHookFn<T>)} fn
     * @example
     *   router.addGlobalHook("onRequest", loggingHook);
     */
    assignGlobalHook(type: 'onError', fn: ErrorHookFn<T>): void;
    assignGlobalHook(type: Exclude<RouteHookType, 'onError'>, fn: HookFn<T>): void;
    assignGlobalHook(type: RouteHookType, fn: HookFn<T> | ErrorHookFn<T>): void {
        this.ensureNotCompiled();

        if (type === 'onError') {
            this.root.assignHook(type, fn as ErrorHookFn<T>);
        } else {
            this.root.assignHook(type, fn as HookFn<T>);
        }
    }

    /**
     * "Вкладывает" другой роутер в текущий.
     *
     * Если у child.root prefix === '' - хуки, обработчики и дети child.root
     * мерджатся прямо в mountPoint.
     * Если у child.root непустой prefix - child.root целиком становится
     * статическим ребёнком mountPoint, или мерджится с уже существующим.
     *
     * @param {string} mountPath
     * @param {Router<T>} child
     * @example
     *   const apiRouter = new Router();
     *   apiRouter.get("/users", listUsers);
     *
     *   const app = new Router();
     *   app.mount("/api", apiRouter);
     *   // GET /api/users -> listUsers
     */
    mount(mountPath: string, child: Router<T>): void {
        this.ensureNotCompiled();

        const segments = parsePath(mountPath);
        let mountPoint = this.root;

        for (const s of segments) {
            mountPoint = mountPoint.getChild(s) ?? mountPoint.createChild(s);
        }

        if (child.root.segment === '') {
            mountPoint.mergeFrom(child.root);
        } else {
            mountPoint.adoptChild(child.root);
        }
    }

    /**
     * Кэширует все хуки для каждого endpoint'а, чтобы не собирать их каждый раз по всему дереву
     */
    compile(): void {
        if (this.isCompiled) {
            return;
        }

        const stack: Array<{
            node: PathSegment<T>;
            onRequest: HookFn<T>[];
            preHandler: HookFn<T>[];
            postHandler: HookFn<T>[];
            onResponse: HookFn<T>[];
            onError: ErrorHookFn<T>[];
        }> = [];

        stack.push({
            node: this.root,
            onRequest: [...this.root.getHooks('onRequest')],
            preHandler: [...this.root.getHooks('preHandler')],
            postHandler: [...this.root.getHooks('postHandler')],
            onResponse: [...this.root.getHooks('onResponse')],
            onError: [...this.root.getHooks('onError')],
        });

        while (stack.length > 0) {
            const { node, onRequest, preHandler, postHandler, onResponse, onError } =
                stack.pop()!;

            // кэшируем только на нодах, у которых есть обработчики
            if (node.canHandle()) {
                node.setCompiledHooks({
                    onRequest,
                    preHandler,
                    postHandler,
                    onResponse,
                    onError,
                });
            }

            const children = node.getAllChildren();
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                stack.push({
                    node: child,
                    onRequest: onRequest.concat(child.getHooks('onRequest')),
                    preHandler: preHandler.concat(child.getHooks('preHandler')),
                    postHandler: postHandler.concat(child.getHooks('postHandler')),
                    onResponse: onResponse.concat(child.getHooks('onResponse')),
                    onError: onError.concat(child.getHooks('onError')),
                });
            }
        }

        this.isCompiled = true;
    }

    /**
     * Бегает по строке path с двумя указателями
     */
    lookup(path: string): LookupResult<T> {
        assert(this.isCompiled, 'Router must be compiled before lookup');

        const SLASH = 47;
        const lookupResult: LookupResult<T> = {
            found: false,
            handlers: null,
            params: {},
            hooks: null,
        };

        const len = path.length;

        let curr: PathSegment<T> = this.root;
        let start = 0;

        // пропускаем ведущий слэш
        if (len > 0 && path.charCodeAt(0) === SLASH) {
            start = 1;
        }

        while (start < len) {
            // находим конец сегмента
            let end = start;
            while (end < len && path.charCodeAt(end) !== SLASH) {
                end++;
            }

            // пустой сегмент (двойной слэш) - пропускаем
            if (end === start) {
                end++;

                continue;
            }

            // TODO: оптимизировать этот слайс (убрать).
            // Это можно сделать с помощью хэш таблицы, которой не нужны аллокации строки
            //* Через SegmentMap это не оптимизируется
            const segment = path.slice(start, end);

            // static
            const staticChild = curr.getStaticChild(segment);
            if (staticChild) {
                curr = staticChild;

                // переместили указатель начала сегмента дальше
                start = end + 1;

                continue;
            }

            // parametric
            const paramChild = curr.getParamChild();
            if (paramChild) {
                // заполнили параметры
                lookupResult.params[paramChild.paramName!] = segment;

                curr = paramChild;
                start = end + 1;

                continue;
            }

            // wildcard - захватываем весь оставшийся путь
            const wildcardChild = curr.getWildcardChild();
            if (wildcardChild) {
                const tail =
                    path.charCodeAt(len - 1) === SLASH
                        ? path.slice(start, len - 1)
                        : path.slice(start);

                return this.resolveNode(wildcardChild, lookupResult, tail);
            }

            return lookupResult;
        }

        return this.resolveNode(curr, lookupResult, '');
    }

    private resolveNode(
        node: PathSegment<T>,
        result: LookupResult<T>,
        wildcardParam: string
    ): LookupResult<T> {
        const target = node.canHandle() ? node : node.getWildcardChild();

        if (target && target.canHandle()) {
            result.params['*'] = wildcardParam;
            result.found = true;
            result.handlers = target.handlers;
            result.hooks = target.getCompiledHooks();
        }

        return result;
    }

    private ensureNotCompiled(): void {
        assert(!this.isCompiled, 'Dynamic assignment of hooks and routes is forbidden');
    }
}
