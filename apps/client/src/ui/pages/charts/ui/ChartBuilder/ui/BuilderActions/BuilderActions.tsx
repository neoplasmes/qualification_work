import { Button } from '@qualification-work/design-system';
import { Play, Save } from 'lucide-react';

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
            size="regular"
            disabled={!canPreview || previewLoading || isSaving}
            aria-busy={previewLoading}
        >
            <Play size={16} />
            Предпросмотр
        </Button>
        {editMode && (
            <Button
                type="button"
                size="regular"
                disabled={!canPreview || isSaving}
                aria-busy={isSaving}
                onClick={onSaveWithoutPreview}
            >
                <Save size={16} />
                Сохранить
            </Button>
        )}
    </div>
);
