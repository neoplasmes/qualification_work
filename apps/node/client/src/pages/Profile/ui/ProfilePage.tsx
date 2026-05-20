import { WorkspaceGrid } from '@/widgets/WorkspaceGrid';

export const ProfilePage = () => (
    <WorkspaceGrid>
        <WorkspaceGrid.Group direction="row">
            <WorkspaceGrid.Panel initialSize="9999px" minSize="320px" maxSize="9999px">
                <div />
            </WorkspaceGrid.Panel>
        </WorkspaceGrid.Group>
    </WorkspaceGrid>
);
