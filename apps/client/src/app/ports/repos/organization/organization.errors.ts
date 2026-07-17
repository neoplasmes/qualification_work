export type OrganizationErrorCode =
    | 'unauthenticated'
    | 'validation'
    | 'conflict'
    | 'notFound';

export class OrganizationError extends Error {
    constructor(
        readonly code: OrganizationErrorCode,
        readonly status: number,
        message: string,
        options?: ErrorOptions,
        readonly fields?: Record<string, string> | string[]
    ) {
        super(message, options);
        this.name = 'OrganizationError';
    }
}
