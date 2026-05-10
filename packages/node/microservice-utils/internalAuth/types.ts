export type OrgRole = 'owner' | 'admin' | 'member';

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
