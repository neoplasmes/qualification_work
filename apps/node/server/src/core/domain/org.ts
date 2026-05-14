export interface Org {
    id: string;
    ownerId: string | null;
    name: string;
    displayName: string;
    createdAt: Date;
    updatedAt: Date;
}
