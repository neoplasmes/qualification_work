import { useCommand } from '@/env/cache/useCommand';
import { useEffect, useRef, useState } from 'react';

import { useDependencies } from '../di/dependencies';

export function useAuthentication() {
    const dependencies = useDependencies();
    const login = useCommand(dependencies.login);
    const register = useCommand(dependencies.register);
    const [isPreparingWorkspace, setIsPreparingWorkspace] = useState(false);
    const controller = useRef<AbortController | undefined>(undefined);
    useEffect(() => () => controller.current?.abort(), []);
    const waitForWorkspace = async () => {
        controller.current?.abort();
        const current = new AbortController();
        controller.current = current;
        setIsPreparingWorkspace(true);
        try {
            await dependencies.session.waitForWorkspace(current.signal);
        } finally {
            if (!current.signal.aborted) {
                setIsPreparingWorkspace(false);
            }
        }
    };

    return {
        login,
        register,
        isPreparingWorkspace,
        waitForWorkspace,
        session: dependencies.session,
    };
}

export function useLogout() {
    const { session } = useDependencies();
    const [isPending, setIsPending] = useState(false);

    return {
        isPending,
        execute: async () => {
            setIsPending(true);
            try {
                await session.logout();
            } finally {
                setIsPending(false);
            }
        },
    };
}
