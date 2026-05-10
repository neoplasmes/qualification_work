import { BaseError, type ErrorType } from '../errors.ts';

/**
 * no X-Internal-Auth header
 *
 * @export
 * @class MissingInternalAuthError
 * @extends {BaseError}
 */
export class MissingInternalAuthError extends BaseError {
    errorType: ErrorType = 'ForbiddenError';

    constructor(message = 'X-Internal-Auth header is missing') {
        super(message, 401);
    }
}

/**
 * User is not a member of the required org
 *
 * @export
 * @class InvalidInternalAuthError
 * @extends {BaseError}
 */
export class InvalidInternalAuthError extends BaseError {
    errorType: ErrorType = 'ForbiddenError';

    constructor(message = 'X-Internal-Auth token is invalid') {
        super(message, 401);
    }
}

/**
 * User is not a member of the required org
 *
 * @export
 * @class ForbiddenOrgError
 * @extends {BaseError}
 */
export class ForbiddenOrgError extends BaseError {
    errorType: ErrorType = 'ForbiddenError';

    constructor(public readonly orgId: string) {
        super(`Forbidden: not a member of org ${orgId}`, 403);
    }
}
