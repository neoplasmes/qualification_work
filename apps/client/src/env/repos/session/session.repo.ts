import type { Session } from '@/core/entities/user';
import {
    errorPayloadSchema,
    parseResponse,
    receiptSchema,
} from '@/env/tools/responseSchema';
import { HttpError, type HttpRequest, type HttpTransport } from '@/env/transport/http';

import type { ReadOptions } from '@/app/ports/repos/readOptions';
import {
    SessionError,
    type LoginInput,
    type RegisterInput,
    type RegisterResult,
    type SessionErrorCode,
    type SessionRepo,
} from '@/app/ports/repos/session';

import { sessionSchema } from './session.schema';

export class HttpSessionRepo implements SessionRepo {
    private detachInterceptors?: () => void;

    constructor(private readonly transport: HttpTransport) {}

    attachInterceptors({
        requestCookie,
        onExpired,
    }: {
        requestCookie?: string;
        onExpired(): void;
    }): () => void {
        this.detachInterceptors?.();
        this.detachInterceptors = this.transport.registerInterceptor({
            onRequest(_request, init) {
                if (typeof window === 'undefined' && requestCookie) {
                    const headers = new Headers(init.headers);
                    headers.set('cookie', requestCookie);
                    init.headers = headers;
                }
            },
            onError(error, request) {
                if (
                    error instanceof HttpError &&
                    error.status === 401 &&
                    !['/auth/login', '/auth/register', '/auth/logout'].includes(
                        request.path
                    )
                ) {
                    onExpired();
                }
            },
        });

        return this.detachInterceptors;
    }

    async getSession(options?: ReadOptions): Promise<Session> {
        const dto = parseResponse(
            sessionSchema,
            await this.request({
                path: '/auth/me',
                method: 'GET',
                responseType: 'json',
                signal: options?.signal,
            })
        );

        return {
            user: {
                ref: `user:${encodeURIComponent(dto.id)}`,
                id: dto.id,
                email: dto.email,
                name: dto.name,
                family: dto.family,
            },
            organizations: dto.organizations.map(org => ({
                ref: `organization:${encodeURIComponent(org.id)}`,
                ...org,
            })),
            isInitializing: dto.isInitializing,
        };
    }

    async register(input: RegisterInput): Promise<RegisterResult> {
        const { email, password, name, family } = input;

        return parseResponse(
            receiptSchema,
            await this.request({
                path: '/auth/register',
                method: 'POST',
                body: { email, password, name, family },
                responseType: 'json',
            })
        );
    }

    async login(input: LoginInput): Promise<void> {
        const { email, password } = input;
        await this.request({
            path: '/auth/login',
            method: 'POST',
            body: { email, password },
            responseType: 'text',
        });
    }

    async logout(): Promise<void> {
        await this.request({
            path: '/auth/logout',
            method: 'POST',
            responseType: 'text',
        });
    }

    private async request(request: HttpRequest): Promise<unknown> {
        try {
            return await this.transport.request(request);
        } catch (cause) {
            if (!(cause instanceof HttpError)) {
                throw cause;
            }
            let code: SessionErrorCode;
            if (cause.status === 400) {
                code = 'validation';
            } else if (cause.status === 401) {
                code = request.path === '/auth/login' ? 'invalidCredentials' : 'expired';
            } else if (cause.status === 409 && request.path === '/auth/register') {
                code = 'emailInUse';
            } else if (cause.status === 423 && request.path === '/auth/login') {
                code = 'locked';
            } else {
                throw cause;
            }
            const payload = errorPayloadSchema.safeParse(cause.payload);
            const defaults: Record<SessionErrorCode, string> = {
                expired: 'Session expired',
                invalidCredentials: 'Invalid email or password',
                emailInUse: 'Email already in use',
                locked: 'Account is temporarily locked',
                validation: 'Invalid request data',
            };

            throw new SessionError(
                code,
                cause.status,
                payload.success && payload.data.error
                    ? payload.data.error
                    : defaults[code],
                { cause },
                payload.success ? payload.data.fields : undefined
            );
        }
    }
}
