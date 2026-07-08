import { Play, Save } from 'lucide-react';

import { Button } from '@/shared/ui';

type BuilderActionsProps = {
    canPreview: boolean;
    editMode: boolean;
    isSaving: boolean;
    formId: string;
    onSaveWithoutPreview: () => void;
    previewLoading: boolean;
};

export const BuilderActions = ({
    canPreview,
    editMode,
    isSaving,
    formId,
    onSaveWithoutPreview,
    previewLoading,
}: BuilderActionsProps) => (
    <div data-stack="h" data-gap="sm" data-align="center">
        <Button
            type="submit"
            form={formId}
            size="sm"
            disabled={!canPreview || previewLoading}
            isLoading={previewLoading}
        >
            <Play size={16} />
            Preview
        </Button>
        {editMode && (
            <Button
                type="button"
                size="sm"
                disabled={!canPreview || isSaving}
                isLoading={isSaving}
                onClick={onSaveWithoutPreview}
            >
                <Save size={16} />
                Save
            </Button>
        )}
    </div>
);
