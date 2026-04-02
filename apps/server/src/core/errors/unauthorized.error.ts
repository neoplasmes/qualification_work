import { BaseError, type ErrorType } from './base';

/**
 * everything is clear from the name of the class
 *
 * @export
 * @class UnauthorizedError
 * @extends {BaseError}
 */
export class UnauthorizedError extends BaseError {
    errorType: ErrorType = 'UnauthorizedError';

    constructor(message: string) {
        super(message, 401);
    }
}
