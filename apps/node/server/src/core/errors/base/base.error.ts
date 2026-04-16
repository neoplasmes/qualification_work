export type ErrorType =
    | 'ValidationError'
    | 'NotFoundError'
    | 'UnauthorizedError'
    | 'ForbiddenError'
    | 'ConflictError'
    | 'InternalServerError';

/**
 * Abstract base error class, that forces to determine errorType field in child classes.
 *
 * @export
 * @abstract
 * @class BaseError
 * @extends {Error}
 */
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
