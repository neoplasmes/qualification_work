import { BaseError, type ErrorType } from './base';

/**
 * should be thrown when request body does not pass validation.
 * actually, should be used only on error after unsuccessfull zod validation
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
    constructor(public readonly fields: string[]) {
        super('Ошибка валидации', 400);
    }
}
