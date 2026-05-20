export type AuthOrg = {
    id: string;
    name: string;
    role: string;
};

export type MeResponse = {
    id: string;
    email: string;
    name: string;
    family: string;
    isInitializing?: boolean;
    organizations: AuthOrg[];
};

export type RegisterPayload = {
    email: string;
    password: string;
    name: string;
    family: string;
};

export type RegisterResponse = {
    id: string;
};

export type LoginPayload = {
    email: string;
    password: string;
};
