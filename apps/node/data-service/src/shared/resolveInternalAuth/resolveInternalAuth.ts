import type { FRequest } from 'primitive-server';

import {
    resolveIdentity,
    setInternalIdentity,
    type InternalIdentity,
    type VerifyOptions,
} from '@qualification-work/microservice-utils/internalAuth';

export type AuthHook = (ctx: { request: FRequest }) => Promise<void>;

// TODO: add tree shaking
/**
 * if NODE_ENV=development and DEV_INTERNAL_IDENTITY is set (JSON),
 * this fn skips JWKS and sets identity directly. that allows to run everything locally without auth service.
 *
 * @export
 * @param {VerifyOptions} options
 * @returns {AuthHook}
 */
export function resolveInternalAuthHook(options: VerifyOptions): AuthHook {
    const devIdentityRaw =
        process.env.NODE_ENV === 'development'
            ? process.env.DEV_INTERNAL_IDENTITY
            : undefined;

    if (devIdentityRaw) {
        let identity: InternalIdentity;
        try {
            identity = JSON.parse(devIdentityRaw) as InternalIdentity;
        } catch {
            throw new Error('DEV_INTERNAL_IDENTITY is not valid JSON');
        }

        // TODO: нормально вот это сделать, я уже с ума схожу
        return async ({ request }) => {
            setInternalIdentity(request, identity);
        };
    }

    return async ({ request }) => {
        const headers = { 'x-internal-auth': request.getHeader('x-internal-auth') };
        const identity = await resolveIdentity(headers, options);

        setInternalIdentity(request, identity);
    };
}
