import { PencilLine, Save } from 'lucide-react';

import { Button } from '@/shared/ui';

type PreviewActionsProps = {
    editMode: boolean;
    isSaving: boolean;
    onBackToConfig: () => void;
    onSave: () => void;
};

export const PreviewActions = ({
    editMode,
    isSaving,
    onBackToConfig,
    onSave,
}: PreviewActionsProps) => (
    <div data-stack="h" data-gap="sm" data-align="center">
        <Button type="button" size="sm" onClick={onBackToConfig}>
            <PencilLine size={16} />
            Edit
        </Button>
        <Button
            type="button"
            size="sm"
            disabled={isSaving}
            isLoading={isSaving}
            onClick={onSave}
        >
            <Save size={16} />
            {editMode ? 'Save changes' : 'Save chart'}
        </Button>
    </div>
);
