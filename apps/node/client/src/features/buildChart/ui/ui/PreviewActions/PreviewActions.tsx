import { PencilLine, Save } from 'lucide-react';

import { Button } from '@/shared/ui';

import type { DatasetChartBuilderViewModel } from '../../../model';

type PreviewActionsProps = {
    model: DatasetChartBuilderViewModel;
};

export const PreviewActions = ({ model }: PreviewActionsProps) => (
    <div data-stack="h" data-gap="sm" data-align="center">
        <Button type="button" size="sm" onClick={model.onBackToConfig}>
            <PencilLine size={16} />
            Edit
        </Button>
        <Button
            type="button"
            size="sm"
            disabled={model.isSaving}
            isLoading={model.isSaving}
            onClick={model.onSave}
        >
            <Save size={16} />
            {model.editMode ? 'Save changes' : 'Save chart'}
        </Button>
    </div>
);
