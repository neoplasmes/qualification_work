import { ContractViolationError, HttpError, NetworkError } from './http.errors';

export interface HttpRequest {
    path: string;
    method: string;
    body?: unknown;
    responseType: 'json' | 'text';
    signal?: AbortSignal;
}

export interface HttpInterceptor {
    onRequest?(request: HttpRequest, init: RequestInit): void;
    onError?(error: unknown, request: HttpRequest): void;
}

export class HttpTransport {
    private readonly interceptors = new Set<HttpInterceptor>();

    constructor(private readonly options: { baseUrl: string; fetch: typeof fetch }) {}

    registerInterceptor(interceptor: HttpInterceptor): () => void {
        this.interceptors.add(interceptor);

        return () => {
            this.interceptors.delete(interceptor);
        };
    }

    async request(request: HttpRequest): Promise<unknown> {
        const headers = new Headers();
        const init: RequestInit = {
            method: request.method,
            credentials: 'include',
            headers,
            signal: request.signal,
        };
        if (typeof FormData !== 'undefined' && request.body instanceof FormData) {
            init.body = request.body;
        } else if (request.body !== undefined) {
            headers.set('content-type', 'application/json');
            init.body = JSON.stringify(request.body);
        }

        const interceptors = [...this.interceptors];
        for (const interceptor of interceptors) {
            interceptor.onRequest?.(request, init);
        }

        const url = `${this.options.baseUrl.replace(/\/+$/, '')}/${request.path.replace(/^\/+/, '')}`;
        let response: Response;
        let text: string;
        try {
            response = await this.options.fetch(url, init);
            text = await response.text();
        } catch (cause) {
            if (
                request.signal?.aborted ||
                (typeof cause === 'object' &&
                    cause !== null &&
                    'name' in cause &&
                    cause.name === 'AbortError')
            ) {
                throw cause;
            }

            throw new NetworkError('Network request failed', { cause });
        }

        if (!response.ok) {
            let payload: unknown = text;
            try {
                payload = JSON.parse(text);
            } catch {
                // preserve raw gateway errors
            }
            const error = new HttpError(response.status, payload);
            for (const interceptor of interceptors) {
                try {
                    interceptor.onError?.(error, request);
                } catch {
                    // observers cannot replace the request failure
                }
            }

            throw error;
        }

        if (request.responseType === 'text') {
            return text;
        }
        try {
            return JSON.parse(text);
        } catch (cause) {
            throw new ContractViolationError('Invalid JSON response', { cause });
        }
    }
}
