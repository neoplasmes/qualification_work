import type { ServerResponse } from 'node:http';

export class FResponse {
    readonly raw: ServerResponse;
    private statusCode = 200;
    private headers: Map<string, string | string[]> = new Map();
    private sent = false;

    constructor(raw: ServerResponse) {
        this.raw = raw;
    }

    get isSent(): boolean {
        return this.sent || this.raw.writableEnded;
    }

    status(code: number): this {
        this.statusCode = code;

        return this;
    }

    getHeader(name: string): string | string[] | null {
        return this.headers.get(name) ?? null;
    }

    setHeader(name: string, value: string | string[]): this {
        this.headers.set(name.toLowerCase(), value);

        return this;
    }

    contentType(contentType: string): this {
        this.headers.set('content-type', contentType);

        return this;
    }

    json(data: unknown): void {
        if (this.sent) return;

        const body = JSON.stringify(data);

        if (!this.headers.has('content-type')) {
            this.headers.set('content-type', 'application/json; charset=utf-8');
        }

        this.flushHeaders();
        this.raw.end(body);
        this.sent = true;
    }

    text(data: string): void {
        if (this.sent) return;

        if (!this.headers.has('content-type')) {
            this.headers.set('content-type', 'text/plain; charset=utf-8');
        }

        this.flushHeaders();
        this.raw.end(data);
        this.sent = true;
    }

    send(data: string | Buffer): void {
        if (this.sent) return;

        this.flushHeaders();
        this.raw.end(data);
        this.sent = true;
    }

    empty(): void {
        if (this.sent) return;

        this.flushHeaders();
        this.raw.end();
        this.sent = true;
    }

    redirect(url: string, permanent = false): void {
        if (this.sent) return;

        this.statusCode = permanent ? 301 : 302;
        this.headers.set('location', url);

        this.flushHeaders();
        this.raw.end();
        this.sent = true;
    }

    private flushHeaders(): void {
        this.raw.statusCode = this.statusCode;
        for (const [key, value] of this.headers) {
            this.raw.setHeader(key, value);
        }
    }
}
