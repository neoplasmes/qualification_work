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

export type LookupResult = {
    found: boolean;
    handlers: HandlerStore | null;
    params: RouteParams;
    hooks: PathSegmentHooksStore | null;
};

export class Router {
    readonly root: PathSegment;

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

        this.root = new PathSegment(prefix);
    }

    addRoute(method: HttpMethod, path: string, handler: RequestHandler): void {
        this.ensureNotCompiled();

        const segments = parsePath(path);

        let curr: PathSegment = this.root;
        for (const s of segments) {
            curr = curr.getChild(s) ?? curr.createChild(s);
        }

        curr.assignHandler(method, handler);
    }

    get(path: string, handler: RequestHandler): void {
        this.addRoute('GET', path, handler);
    }

    post(path: string, handler: RequestHandler): void {
        this.addRoute('POST', path, handler);
    }

    put(path: string, handler: RequestHandler): void {
        this.addRoute('PUT', path, handler);
    }

    patch(path: string, handler: RequestHandler): void {
        this.addRoute('PATCH', path, handler);
    }

    delete(path: string, handler: RequestHandler): void {
        this.addRoute('DELETE', path, handler);
    }

    /**
     * Функция для добавления хука конкретно на данный PathSegment
     *
     * @param {RouteHookType} type
     * @param {(HookFn | ErrorHookFn)} fn
     */
    assignHook(type: 'onError', path: string, fn: ErrorHookFn): void;
    assignHook(type: Exclude<RouteHookType, 'onError'>, path: string, fn: HookFn): void;
    assignHook(type: RouteHookType, path: string, fn: HookFn | ErrorHookFn): void {
        this.ensureNotCompiled();

        const segments = parsePath(path);

        let curr: PathSegment = this.root;
        for (const s of segments) {
            const next = curr.getChild(s);

            assert(next !== null, `The segment ${s} is not presented in the router tree`);

            curr = next;
        }

        // boilerplate из-за typescript
        if (type === 'onError') {
            curr.assignHook(type, fn as ErrorHookFn);
        } else {
            curr.assignHook(type, fn as HookFn);
        }
    }

    /**
     * Добавить хук на корневой элемент роутера, чтобы хук применялся вообще ко всем маршрутам
     *
     * @param {RouteHookType} type
     * @param {(HookFn | ErrorHookFn)} fn
     * @example
     *   router.addGlobalHook("onRequest", loggingHook);
     */
    assignGlobalHook(type: 'onError', fn: ErrorHookFn): void;
    assignGlobalHook(type: Exclude<RouteHookType, 'onError'>, fn: HookFn): void;
    assignGlobalHook(type: RouteHookType, fn: HookFn | ErrorHookFn): void {
        this.ensureNotCompiled();

        if (type === 'onError') {
            this.root.assignHook(type, fn as ErrorHookFn);
        } else {
            this.root.assignHook(type, fn as HookFn);
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
     * @param {Router} child
     * @example
     *   const apiRouter = new Router();
     *   apiRouter.get("/users", listUsers);
     *
     *   const app = new Router();
     *   app.mount("/api", apiRouter);
     *   // GET /api/users -> listUsers
     */
    mount(mountPath: string, child: Router): void {
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
            node: PathSegment;
            onRequest: HookFn[];
            preHandler: HookFn[];
            postHandler: HookFn[];
            onResponse: HookFn[];
            onError: ErrorHookFn[];
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
    lookup(path: string): LookupResult {
        assert(this.isCompiled, 'Router must be compiled before lookup');

        const SLASH = 47;
        const lookupResult: LookupResult = {
            found: false,
            handlers: null,
            params: {},
            hooks: null,
        };

        const len = path.length;

        let curr: PathSegment = this.root;
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

            // wildcard
            const wildcardChild = curr.getWildcardChild();
            if (wildcardChild) {
                if (!wildcardChild.canHandle()) {
                    return lookupResult;
                }

                // Всё, что осталось на потом
                lookupResult.params['*'] =
                    path.charCodeAt(len - 1) === SLASH
                        ? path.slice(start, len - 1)
                        : path.slice(start);

                lookupResult.found = true;
                lookupResult.handlers = wildcardChild.handlers;
                lookupResult.hooks = wildcardChild.getCompiledHooks();

                // Возвращаем сразу всё здесь, т.к. после wildcard нет смысла смотреть
                return lookupResult;
            }

            return lookupResult;
        }

        if (!curr.canHandle()) {
            return lookupResult;
        }

        lookupResult.found = true;
        lookupResult.handlers = curr.handlers;
        lookupResult.hooks = curr.getCompiledHooks();

        return lookupResult;
    }

    private ensureNotCompiled(): void {
        assert(!this.isCompiled, 'Dynamic assignment of hooks and routes is forbidden');
    }
}
