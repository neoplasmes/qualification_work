import { useCommand } from '@/env/cache/useCommand';
import { useRead } from '@/env/cache/useRead';
import { useDependencies } from '@/ui/di/dependencies';
import { useActiveOrganization, useSession } from '@/ui/session';

export function useActionsController() {
    const dependencies = useDependencies();
    const session = useSession();
    const { activeOrg: org } = useActiveOrganization(session.data);
    const actionsQuery = useRead(
        dependencies.listActions,
        { orgId: org?.id ?? '' },
        { enabled: Boolean(org) }
    );
    const createAction = useCommand(dependencies.createAction);
    const updateAction = useCommand(dependencies.updateAction);
    const patchAction = useCommand(dependencies.patchAction);
    const archiveAction = useCommand(dependencies.archiveAction);
    const executeAction = useCommand(dependencies.executeAction);

    return {
        org,
        actionsQuery,
        createAction,
        updateAction,
        patchAction,
        archiveAction,
        executeAction,
    };
}
