export type ErrorType =
    | 'ValidationError'
    | 'NotFoundError'
    | 'ForbiddenError'
    | 'ConflictError'
    | 'InternalServerError';

export abstract class BaseError extends Error {
    abstract errorType: ErrorType;

    constructor(
        message: string,
        /**
         * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status
         */
        public readonly statusCode: number = 500
    ) {
        super(message);
    }
}

/**
 * should be thrown when content body does not pass validation.
 * the most frequent use case - throw on the zod validation failure.
 */
export class ValidationError extends BaseError {
    errorType: ErrorType = 'ValidationError';

    constructor(
        public readonly fields: string[] = [],
        message = 'Validation error'
    ) {
        super(message, 400);
    }
}

export class NotFoundError extends BaseError {
    errorType: ErrorType = 'NotFoundError';

    constructor(message: string) {
        super(message, 404);
    }
}

/**
 * Should be thrown on conflict with UNIQUE fields
 */
export class ConflictError extends BaseError {
    errorType: ErrorType = 'ConflictError';

    constructor(message: string) {
        super(message, 409);
    }
}

/**
 * Use when it is not clear which error to throw.
 */
export class AppError extends BaseError {
    errorType: ErrorType;

    constructor(
        message: string,
        statusCode: number = 500,
        errorType: ErrorType = 'InternalServerError'
    ) {
        super(message, statusCode);
        this.errorType = errorType;
    }
}
