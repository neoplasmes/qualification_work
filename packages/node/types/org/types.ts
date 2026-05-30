import type { organizationRoles } from './const.js';

export type OrganizationRoles = (typeof organizationRoles)[number];

export enum OrganizationRole {
    Owner = 'owner',
    Editor = 'editor',
    Viewer = 'viewer',
}

export type OrgDB = {
    id: string;
    ownerId: string | null;
    name: string;
    displayName: string;
    createdAt: Date;
    updatedAt: Date;
};

export type OrgResponse = Omit<OrgDB, 'createdAt' | 'updatedAt'> & {
    createdAt: string;
    updatedAt: string;
};

export type CreateOrgPayload = {
    name: string;
    displayName: string;
    ownerId: string;
};

export type CreateOrgResponse = {
    id: string;
};

export type Org = OrgResponse;
