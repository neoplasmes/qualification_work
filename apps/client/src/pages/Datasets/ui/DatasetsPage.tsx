import { WorkspaceGrid } from '@/widgets/WorkspaceGrid';

export const DatasetsPage = () => {
    return (
        <WorkspaceGrid>
            <WorkspaceGrid.Group direction="row">
                <WorkspaceGrid.Panel initialSize="300px" minSize="200px" maxSize="500px">
                    <div>Panel 1</div>
                </WorkspaceGrid.Panel>
                <WorkspaceGrid.Panel
                    initialSize="1000px"
                    minSize="600px"
                    maxSize="1000px"
                >
                    <div>Panel 2</div>
                </WorkspaceGrid.Panel>
            </WorkspaceGrid.Group>
        </WorkspaceGrid>
    );
};
