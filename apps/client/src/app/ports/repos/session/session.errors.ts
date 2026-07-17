export type SessionErrorCode =
    | 'expired'
    | 'invalidCredentials'
    | 'emailInUse'
    | 'locked'
    | 'validation';

export class SessionError extends Error {
    constructor(
        readonly code: SessionErrorCode,
        readonly status: number,
        message: string,
        options?: ErrorOptions,
        readonly fields?: Record<string, string> | string[]
    ) {
        super(message, options);
        this.name = 'SessionError';
    }
}
