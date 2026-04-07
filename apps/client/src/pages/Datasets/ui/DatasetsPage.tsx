import { WorkspaceGrid } from '@/widgets/WorkspaceGrid';

export const DatasetsPage = () => {
    return (
        <WorkspaceGrid>
            <WorkspaceGrid.Group direction="row">
                <WorkspaceGrid.Panel>
                    <div>Panel 1</div>
                </WorkspaceGrid.Panel>
                <WorkspaceGrid.Panel>
                    <div>Panel 2</div>
                </WorkspaceGrid.Panel>
            </WorkspaceGrid.Group>
        </WorkspaceGrid>
    );
};
