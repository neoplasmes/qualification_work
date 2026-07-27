import { useCommand } from '@/env/cache/useCommand';
import { useDependencies } from '@/ui/di/dependencies';
import { getApiErrorMessage } from '@/ui/errors/apiError';
import { useRef, useState } from 'react';

import type {
    DashboardItemLayoutInput,
    DashboardScope,
} from '@/app/ports/repos/dashboard';

type LayoutDraft = {
    scope: string;
    version: number;
    layout: DashboardItemLayoutInput[];
    confirmed: boolean;
};

export function useDashboardLayoutController({ orgId, dashboardId }: DashboardScope) {
    const dependencies = useDependencies();
    const command = useCommand(dependencies.updateDashboardLayout);
    const [draft, setDraft] = useState<LayoutDraft | null>(null);
    const [feedback, setFeedback] = useState<{ scope: string; message: string } | null>(
        null
    );
    const version = useRef(0);
    const scope = JSON.stringify([orgId, dashboardId]);
    const currentScope = useRef(scope);
    currentScope.current = scope;

    const save = async (layout: DashboardItemLayoutInput[]) => {
        if (!orgId || !dashboardId || !layout.length) {
            return;
        }
        const sentVersion = ++version.current;
        setDraft({ scope, version: sentVersion, layout, confirmed: false });
        setFeedback(null);
        try {
            const outcome = await command.executeOutcome({ orgId, dashboardId, layout });
            if (currentScope.current !== scope || version.current !== sentVersion) {
                return;
            }
            if (outcome.syncError) {
                setDraft(current =>
                    current?.version === sentVersion && current.scope === scope
                        ? { ...current, confirmed: true }
                        : current
                );
                setFeedback({
                    scope,
                    message:
                        'Расположение сохранено, но обновление данных не удалось. Обновите данные.',
                });
            } else {
                setDraft(current =>
                    current?.version === sentVersion && current.scope === scope
                        ? null
                        : current
                );
            }
        } catch (error) {
            if (currentScope.current === scope && version.current === sentVersion) {
                setFeedback({
                    scope,
                    message: getApiErrorMessage(
                        error,
                        'Не удалось сохранить расположение. Черновик сохранён; повторите запись.'
                    ),
                });
            }
        }
    };

    const retry = async () => {
        if (!draft || draft.scope !== scope) {
            return;
        }
        if (!draft.confirmed) {
            await save(draft.layout);

            return;
        }
        try {
            await dependencies.cache.read(dependencies.getDashboard, {
                orgId,
                dashboardId,
            });
            if (currentScope.current !== scope || version.current !== draft.version) {
                return;
            }
            setDraft(current => (current === draft ? null : current));
            setFeedback(null);
        } catch {
            if (currentScope.current !== scope || version.current !== draft.version) {
                return;
            }
            setFeedback({
                scope,
                message:
                    'Расположение сохранено, но обновление данных не удалось. Обновите данные.',
            });
        }
    };

    return {
        layout: draft?.scope === scope ? draft.layout : undefined,
        error: feedback?.scope === scope ? feedback.message : '',
        save,
        retry,
        isPending: command.isPending,
    };
}
