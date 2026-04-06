import { BaseError, type ErrorType } from './base';

/**
 * should be thrown when conntent body does not pass validation.
 * the most frequent use case - throw on the zod validation failure.
 *
 * @export
 * @class ValidationError
 * @extends {BaseError}
 */
export class ValidationError extends BaseError {
    errorType: ErrorType = 'ValidationError';

    /**
     * Creates an instance of ValidationError.
     *
     * @constructor
     * @param {string[]} fields - array of fields that didn't pass validation
     */
    constructor(
        public readonly fields: string[] = [],
        message = 'Validation error'
    ) {
        super(message, 400);
    }
}
