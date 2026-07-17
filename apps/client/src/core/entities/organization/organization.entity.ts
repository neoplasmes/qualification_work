import type { Entity } from '../entity';

export type OrganizationRole = 'owner' | 'editor' | 'viewer';

export interface Organization extends Entity {
    readonly ref: `organization:${string}`;
    id: string;
    name: string;
    role: OrganizationRole;
}
