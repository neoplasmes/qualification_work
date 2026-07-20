import { getActionsWorkspaceBasePath } from '@/ui/pages/actions';
import { ChartsEditorProvider, getChartsWorkspaceBasePath } from '@/ui/pages/charts';
import { WorkspaceLayout } from '@/ui/widgets/WorkspaceLayout';
import { useLocation } from 'react-router';

import { workspaceSlots } from './workspaceSlots';

export function WorkspaceHost() {
    const { pathname } = useLocation();
    const slots =
        workspaceSlots[getActionsWorkspaceBasePath(getChartsWorkspaceBasePath(pathname))];

    return (
        <ChartsEditorProvider>
            {slots && <WorkspaceLayout slots={slots} />}
        </ChartsEditorProvider>
    );
}
