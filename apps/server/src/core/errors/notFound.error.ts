import { BaseError, type ErrorType } from './base';

/**
 * everything is clear from the name of the class
 *
 * @export
 * @class NotFoundError
 * @extends {BaseError}
 */
export class NotFoundError extends BaseError {
    errorType: ErrorType = 'NotFoundError';

    constructor(message: string) {
        super(message, 404);
    }
}
