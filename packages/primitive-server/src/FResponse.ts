import { ServerResponse } from 'node:http';
import type { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import type { FRequest } from './FRequest';

export class FResponse extends ServerResponse<FRequest> {
    constructor(request: FRequest) {
        super(request);
    }

    get sent(): boolean {
        return this.writableEnded;
    }

    status(code: number): this {
        this.statusCode = code;

        return this;
    }

    /**
     * Установить заголовок content-type
     *
     * @param contentType
     * @returns
     */
    contentType(contentType: string): this {
        this.setHeader('content-type', contentType);

        return this;
    }

    /**
     * Установка заголовков с помощью объекта key: value
     *
     * @param headers
     */
    head(headers: Record<string, string | number>): this;
    /**
     * Установка одного заголовка
     *
     * @param {string} name
     * @param {(string | number)} value
     * @returns {this}
     */
    head(name: string, value: string | number): this;
    /**
     * Общий метод установки заголовков
     *
     * @param nameOrHeaders
     * @param value
     * @returns
     */
    head(
        nameOrHeaders: string | Record<string, string | number>,
        value?: string | number
    ): this {
        if (typeof nameOrHeaders === 'string') {
            this.setHeader(nameOrHeaders.toLowerCase(), String(value));
        } else {
            for (const [key, val] of Object.entries(nameOrHeaders)) {
                this.setHeader(key.toLowerCase(), String(val));
            }
        }

        return this;
    }

    /**
     * content-type: application/json
     *
     * @param {unknown} data
     */
    json(data: unknown): void {
        if (this.sent) {
            return;
        }

        const body = JSON.stringify(data);

        this.setHeader('content-type', 'application/json; charset=utf-8');
        this.setHeader('content-length', Buffer.byteLength(body));
        this.end(body);
    }

    /**
     * content-type: text/plain
     *
     * @param {string} data
     */
    text(data: string): void {
        if (this.sent) {
            return;
        }

        if (!this.hasHeader('content-type')) {
            this.setHeader('content-type', 'text/plain; charset=utf-8');
        }

        this.setHeader('content-length', Buffer.byteLength(data));
        this.end(data);
    }

    /**
     * Использовать для отправки данных с Content-Type, для которого не предоставлен шорткат
     *
     * @param data
     * @returns
     */
    send(data: string | Buffer): void {
        if (this.sent) {
            return;
        }

        const length = typeof data === 'string' ? Buffer.byteLength(data) : data.length;

        this.setHeader('content-length', length);
        this.end(data);
    }

    /**
     * Стримит указанный поток в овет
     *
     * @param readable
     * @returns
     */
    async stream(readable: Readable): Promise<void> {
        if (this.sent) {
            return;
        }

        await pipeline(readable, this);
    }

    redirect(url: string, permanent = false): void {
        if (this.sent) {
            return;
        }

        this.statusCode = permanent ? 301 : 302;

        this.setHeader('location', url);
        this.end();
    }
}
