import { IncomingMessage } from 'node:http';
import type { QueryParams, RouteParams } from './types';
import { parseQuery } from './utils/parseQuery';
import type { Socket } from 'node:net';

export class FRequest extends IncomingMessage {
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
    private _pathname: string | null = null;
    private _rawQueryString: string | null = null;

    constructor(socket: Socket) {
        super(socket);
        this.params = {};
    }

    get URL(): string {
        if (!this.url) {
            throw new Error(
                'AAAAAAAAAAA AAAAAAAAAAAAAAAA AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
            );
        }

        return this.url;
    }

    get pathname(): string {
        if (this._pathname === null) {
            this.parseUrl();
        }

        return this._pathname!;
    }

    private get rawQueryString(): string {
        if (this._rawQueryString === null) {
            this.parseUrl();
        }

        return this._rawQueryString!;
    }

    private parseUrl(): void {
        const url = this.url ?? '/';
        const queryIdx = url.indexOf('?');

        if (queryIdx !== -1) {
            this._pathname = url.slice(0, queryIdx);
            this._rawQueryString = url.slice(queryIdx + 1);
        } else {
            this._pathname = url;
            this._rawQueryString = '';
        }
    }

    /**
     * Даже если header - массив, мы возвращаем только первый элемент для упрощения
     *
     * @param name
     * @returns
     */
    getHeader(name: string): string | undefined {
        const val = this.headers[name.toLowerCase()];

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
        const chunks: Buffer[] = [];
        const maxBytes = 1 * 1024 * 1024; // 1 MB
        let size = 0;

        const declaredLength = Number(this.getHeader('content-length'));
        if (declaredLength > maxBytes) {
            this.destroy();

            return Promise.reject(
                new Error(`Request body exceeded ${maxBytes} bytes limit`)
            );
        }

        return new Promise<Buffer>((resolve, reject) => {
            this.on('data', (chunk: Buffer) => {
                size += chunk.length;

                if (size > maxBytes) {
                    this.destroy();
                    reject(new Error(`Request body exceeded ${maxBytes} bytes limit`));

                    return;
                }

                chunks.push(chunk);
            });

            this.on('end', () => resolve(Buffer.concat(chunks)));
            this.on('error', reject);
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
