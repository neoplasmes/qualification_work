import { z } from 'zod';

/**
 * common wrapper of every event published to kafka
 *
 * @param type
 * @param payload
 * @returns
 */
export const envelopeSchema = <T extends string, P extends z.ZodType>(type: T, payload: P) =>
    z.object({
        eventId: z.uuid(),
        type: z.literal(type),
        version: z.literal(1),
        occurredAt: z.iso.datetime(),
        aggregateId: z.uuid(),
        orgId: z.uuid(),
        payload,
    });

export type EventEnvelope<T extends string = string, P = unknown> = {
    eventId: string;
    type: T;
    version: 1;
    occurredAt: string;
    aggregateId: string;
    orgId: string;
    payload: P;
};
