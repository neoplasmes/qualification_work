import type { HttpMethod, RequestHandler } from '../types';

/**
 * Хранилище хэндлеров для каждого HTTP метода.
 * Класс вместо Map, чтобы V8 создал стабильный hidden class
 * и обращался к свойствам по offset, а не через хеширование.
 */
export class HandlerStore {
    private cachedHasAny: boolean | null = null;
    private cachedAllowHeader: string | null = null;

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
        if (!(this.cachedAllowHeader === null)) {
            return this.cachedAllowHeader;
        }

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
        if (!(this.cachedHasAny === null)) {
            return this.cachedHasAny;
        }

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
