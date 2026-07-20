import { useCommand } from '@/env/cache/useCommand';
import { useEffect, useRef, useState } from 'react';

import { useDependencies } from '../di/dependencies';

export function useAuthentication() {
    const dependencies = useDependencies();
    const login = useCommand(dependencies.login);
    const register = useCommand(dependencies.register);
    const [isPreparingWorkspace, setIsPreparingWorkspace] = useState(false);
    const lifetime = useRef({ active: true }).current;
    const controller = useRef<AbortController | undefined>(undefined);
    useEffect(() => {
        lifetime.active = true;

        return () => {
            lifetime.active = false;
            controller.current?.abort();
        };
    }, [lifetime]);

    const waitForWorkspace = async () => {
        if (!lifetime.active) {
            return;
        }
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
        lifetime: lifetime as Readonly<typeof lifetime>,
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
