import type { HttpMethod, RequestHandler } from '../types';

/**
 * Хранилище хэндлеров для каждого HTTP метода.
 * Класс вместо Map, чтобы V8 создал стабильный hidden class
 * и обращался к свойствам по offset, а не через хеширование.
 */
export class HandlerStore<T extends Record<string, unknown> = Record<string, unknown>> {
    private cachedHasAny: boolean | null = null;
    private cachedAllowedMethods: string | null = null;

    GET: RequestHandler<T> | null = null;
    POST: RequestHandler<T> | null = null;
    PUT: RequestHandler<T> | null = null;
    PATCH: RequestHandler<T> | null = null;
    DELETE: RequestHandler<T> | null = null;
    OPTIONS: RequestHandler<T> | null = null;
    HEAD: RequestHandler<T> | null = null;

    get(method: HttpMethod): RequestHandler<T> | null {
        return this[method];
    }

    set(method: HttpMethod, handler: RequestHandler<T>): void {
        this[method] = handler;
    }

    has(method: HttpMethod): boolean {
        return this[method] !== null;
    }

    /**
     * Строка для заголовка Allow, например "GET, POST, OPTIONS"
     */
    getAllowedMethods(): string {
        if (!(this.cachedAllowedMethods === null)) {
            return this.cachedAllowedMethods;
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
