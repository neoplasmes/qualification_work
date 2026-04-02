import { BaseError, type ErrorType } from './base/base.error';

/**
 * Use when it is not clear which error to throw.
 * All other errors should extend exactly this class.
 *
 * @export
 * @class AppError
 * @extends {BaseError}
 */
export class AppError extends BaseError {
    errorType: ErrorType;

    constructor(
        message: string,
        statusCode: number,
        errorType: ErrorType = 'InternalServerError'
    ) {
        super(message, statusCode);
        this.errorType = errorType;
    }
}
