export interface Organization {
    id: string;
    ownerId: string | null;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}
