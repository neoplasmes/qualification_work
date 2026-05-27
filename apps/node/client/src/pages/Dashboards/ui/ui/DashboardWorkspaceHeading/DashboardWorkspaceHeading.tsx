import { Plus } from 'lucide-react';

import { WorkspaceTitleEditor } from '@/widgets/WorkspaceTitleEditor';

import { Button } from '@/shared/ui';

import { dashboardsTestIds } from '../../../const';

type DashboardWorkspaceHeadingProps = {
    name: string;
    onAddMetric: () => void;
    onAddChart: () => void;
};

export const DashboardWorkspaceHeading = ({
    name,
    onAddMetric,
    onAddChart,
}: DashboardWorkspaceHeadingProps) => (
    <div data-stack="h" data-justify="between" data-align="center">
        <WorkspaceTitleEditor
            title={name}
            fallbackTitle="Untitled dashboard"
            editable={false}
            onRename={() => undefined}
        />

        <div data-stack="h" data-gap="sm">
            <Button
                data-test-id={dashboardsTestIds.openAddMetricModalButton}
                onClick={onAddMetric}
            >
                <Plus size={20} />
                Metric
            </Button>
            <Button
                data-test-id={dashboardsTestIds.openAddChartModalButton}
                onClick={onAddChart}
            >
                <Plus size={20} />
                Chart
            </Button>
        </div>
    </div>
);
