export interface CreateOrgInput {
    name: string;
    displayName: string;
    ownerId: string;
}

export interface CreateOrgResult {
    id: string;
}

export interface DeleteOrgInput {
    orgId: string;
}

export interface OrganizationRepo {
    createOrganization(input: CreateOrgInput): Promise<CreateOrgResult>;
    deleteOrganization(input: DeleteOrgInput): Promise<void>;
}
