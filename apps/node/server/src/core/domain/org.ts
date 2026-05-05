export interface Org {
    id: string;
    ownerId: string | null;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}
