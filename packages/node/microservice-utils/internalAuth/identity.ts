import { MissingInternalAuthError } from './errors.ts';
import type { InternalIdentity } from './types.ts';

/**
 * internal jwt identity symbol for the tracking of ... jwt identity on some objects
 *
 * @type {symbol}
 */
const INTERNAL_IDENTITY: symbol = Symbol.for(
    '@qualification-work/microservice-utils/internalAuth/identity'
);

type WithIdentity = { [INTERNAL_IDENTITY]?: InternalIdentity };

/**
 * helper, that sets internal identity symbol on any object
 *
 * @export
 * @param {object} target
 * @param {InternalIdentity} identity
 */
export function setInternalIdentity(target: object, identity: InternalIdentity): void {
    (target as WithIdentity)[INTERNAL_IDENTITY] = identity;
}

/**
 * Description placeholder
 *
 * @export
 * @param {object} target
 * @returns {InternalIdentity}
 */
export function getInternalIdentity(target: object): InternalIdentity {
    const stored = (target as WithIdentity)[INTERNAL_IDENTITY];
    if (!stored) {
        throw new MissingInternalAuthError('identity is not present');
    }

    return stored;
}
