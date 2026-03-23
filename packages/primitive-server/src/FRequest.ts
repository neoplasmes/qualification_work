import type { IncomingMessage } from 'node:http';
import type { HttpMethod, QueryParams, RouteParams } from './types';
import { parseQuery } from './utils/parseQuery';

export class FRequest {
    readonly raw: IncomingMessage;
    readonly method: HttpMethod;
    readonly url: string;
    readonly pathname: string;

    /**
     * Параметры из /:params
     *
     * @type {RouteParams}
     */
    params: RouteParams;

    /**
     * Мы храним это именно так, потому что если бы было как раньше (bodyRead, rawBody и body()), то
     * при параллельных вызовах IncomingMessage (stream) начал бы читаться в двух разных местах
     * тогда бы было два листнера на IncomingMessage.on('data'). Каждый бы пушил чанки в результат
     * и в итоге body было бы не то.
     *
     * @private
     * @type {(Promise<Buffer> | null)}
     */
    private bodyPromise: Promise<Buffer> | null = null;

    private _query: QueryParams | null = null;
    private rawQueryString: string;

    constructor(raw: IncomingMessage) {
        this.raw = raw;

        this.method = (raw.method ?? 'GET').toUpperCase() as HttpMethod;

        const normalizedUrl = raw.url ?? '/';
        this.url = normalizedUrl;

        const queryIdx = normalizedUrl.indexOf('?');
        if (queryIdx !== -1) {
            this.pathname = normalizedUrl.slice(0, queryIdx);
            this.rawQueryString = normalizedUrl.slice(queryIdx + 1);
        } else {
            this.pathname = normalizedUrl;
            this.rawQueryString = '';
        }

        this.params = {};
    }

    /**
     * Даже если header - массив, мы возвращаем только первый элемент для упрощения
     *
     * @param name
     * @returns
     */
    getHeader(name: string): string | undefined {
        const val = this.raw.headers[name.toLowerCase()];

        return Array.isArray(val) ? val[0] : val;
    }

    get contentType(): string | undefined {
        const ct = this.getHeader('content-type');

        if (!ct) {
            return undefined;
        }

        const semi = ct.indexOf(';');

        return (semi === -1 ? ct : ct.slice(0, semi)).trim().toLowerCase();
    }

    get query(): QueryParams {
        if (this._query === null) {
            this._query = parseQuery(this.rawQueryString);
        }

        return this._query;
    }

    async body(): Promise<Buffer> {
        if (!this.bodyPromise) {
            this.bodyPromise = this.readBody();
        }

        return this.bodyPromise;
    }

    private readBody(): Promise<Buffer> {
        const raw = this.raw;
        const chunks: Buffer[] = [];
        const maxBytes = 1 * 1024 * 1024; // 1 MB
        let size = 0;

        return new Promise<Buffer>((resolve, reject) => {
            raw.on('data', (chunk: Buffer) => {
                size += chunk.length;

                if (size > maxBytes) {
                    raw.destroy();
                    reject(new Error(`Request body exceeded ${maxBytes} bytes limit`));

                    return;
                }

                chunks.push(chunk);
            });

            raw.on('end', () => resolve(Buffer.concat(chunks)));
            raw.on('error', reject);
        });
    }

    async text(): Promise<string> {
        const buf = await this.body();

        return buf.toString('utf-8');
    }

    async json<T = unknown>(): Promise<T> {
        const raw = await this.text();

        try {
            return JSON.parse(raw) as T;
        } catch {
            throw new Error('Invalid JSON body');
        }
    }
}
