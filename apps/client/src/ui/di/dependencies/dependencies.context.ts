import type { Session } from '@/core/entities/user';
import { createContext, useContext } from 'react';

import type { Command } from '@/app/commands/command';
import type {
    CreateOrgInput,
    CreateOrgResult,
    DeleteOrgInput,
} from '@/app/ports/repos/organization';
import type {
    LoginInput,
    RegisterInput,
    RegisterResult,
} from '@/app/ports/repos/session';
import type { Query } from '@/app/queries/query';

export interface SessionController {
    subscribe(listener: () => void): () => void;
    snapshot(): number;
    canRead: boolean;
    activeOrgId: string | null;
    setActiveOrgId(id: string | null): void;
    setNavigator(navigate: (path: string) => void): void;
    reset(): Promise<void>;
    logout(): Promise<void>;
    waitForWorkspace(signal?: AbortSignal): Promise<void>;
}

export interface Dependencies {
    getSession: Query<void, Session>;
    register: Command<RegisterInput, RegisterResult>;
    login: Command<LoginInput, void>;
    logout: Command<void, void>;
    createOrganization: Command<CreateOrgInput, CreateOrgResult>;
    deleteOrganization: Command<DeleteOrgInput, void>;
    session: SessionController;
}

export const dependenciesContext = createContext<Dependencies | null>(null);

export function useDependencies(): Dependencies {
    const dependencies = useContext(dependenciesContext);
    if (!dependencies) {
        throw new Error('Dependencies provider is required');
    }

    return dependencies;
}
