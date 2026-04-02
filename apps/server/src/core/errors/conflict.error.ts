import { BaseError, type ErrorType } from './base';

/**
 * Dshould be thrown on conflict with UNIQUE fields
 *
 * @export
 * @class ConflictError
 * @extends {BaseError}
 */
export class ConflictError extends BaseError {
    errorType: ErrorType = 'ConflictError';

    constructor(message: string) {
        super(message, 409);
    }
}
