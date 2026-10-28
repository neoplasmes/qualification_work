import { z } from 'zod';

import { envelopeSchema } from './envelope.js';

export const orgCreatedSchema = envelopeSchema(
    'OrgCreated',
    z.object({
        name: z.string(),
        displayName: z.string(),
        ownerId: z.uuid(),
    })
);

export const orgDeletedSchema = envelopeSchema('OrgDeleted', z.object({}));

export const identityOrgEventSchema = z.discriminatedUnion('type', [
    orgCreatedSchema,
    orgDeletedSchema,
]);

export type OrgCreatedEvent = z.infer<typeof orgCreatedSchema>;
export type OrgDeletedEvent = z.infer<typeof orgDeletedSchema>;
export type IdentityOrgEvent = z.infer<typeof identityOrgEventSchema>;
