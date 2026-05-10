export type OrgRole = 'owner' | 'viewer' | 'editor';

export type OrgMembership = {
    id: string;
    role: OrgRole;
};

export type InternalIdentity = {
    userId: string;
    orgs: OrgMembership[];
};

export type VerifyOptions = {
    jwksUrl: string;
    issuer: string;
    audience: string;
};
