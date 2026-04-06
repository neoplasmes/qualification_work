import { BaseError, type ErrorType } from './base/base.error';

/**
 * Use when it is not clear which error to throw.
 *
 * @export
 * @class AppError
 * @extends {BaseError}
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
