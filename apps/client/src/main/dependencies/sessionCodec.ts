import type { Organization } from '@/core/entities/organization';
import type { Session, User } from '@/core/entities/user';
import { MissingEntityError, type ReadCodec } from '@/env/cache/normalize';

export const sessionCodec: ReadCodec<void, Session> = {
    async normalize(session, _input, store) {
        await store.upsert(session.user.ref, session.user);
        for (const organization of session.organizations) {
            await store.upsert(organization.ref, organization);
        }

        return {
            tree: {
                kind: 'object',
                children: {
                    user: { kind: 'ref', ref: session.user.ref },
                    organizations: {
                        kind: 'array',
                        children: session.organizations.map(org => ({
                            kind: 'ref',
                            ref: org.ref,
                        })),
                    },
                    isInitializing: { kind: 'value', value: session.isInitializing },
                },
            },
            refs: [session.user.ref, ...session.organizations.map(org => org.ref)],
        };
    },
    resolve(result, store) {
        if (result.tree.kind !== 'object') {
            throw new Error('Invalid session composition');
        }
        const { user: userNode, organizations, isInitializing } = result.tree.children;
        if (
            userNode?.kind !== 'ref' ||
            organizations?.kind !== 'array' ||
            isInitializing?.kind !== 'value'
        ) {
            throw new Error('Invalid session composition');
        }
        const user = store.get(userNode.ref);
        if (
            !user ||
            typeof user.id !== 'string' ||
            !('email' in user) ||
            typeof user.email !== 'string' ||
            !('name' in user) ||
            typeof user.name !== 'string' ||
            !('family' in user) ||
            typeof user.family !== 'string'
        ) {
            throw new MissingEntityError(userNode.ref);
        }

        return {
            user: user as User,
            organizations: organizations.children.map(node => {
                if (node.kind !== 'ref') {
                    throw new Error('Invalid organization composition');
                }
                const org = store.get(node.ref);
                if (
                    !org ||
                    typeof org.id !== 'string' ||
                    !('name' in org) ||
                    typeof org.name !== 'string' ||
                    !('role' in org) ||
                    typeof org.role !== 'string'
                ) {
                    throw new MissingEntityError(node.ref);
                }

                return org as Organization;
            }),
            isInitializing: isInitializing.value as boolean,
        };
    },
};
