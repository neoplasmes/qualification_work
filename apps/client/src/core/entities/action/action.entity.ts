import type { ActionEffect, ActionParameter } from '@qualification-work/types';

import type { Entity } from '../entity';

export interface Action extends Entity {
    readonly ref: `action:${string}`;
    id: string;
    orgId: string;
    name: string;
    description: string | null;
    parameters: ActionParameter[];
    effects: ActionEffect[];
    createdAt: string;
    updatedAt: string;
    archivedAt: string | null;
}
