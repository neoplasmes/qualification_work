import { Play, Save } from 'lucide-react';

import { Button, Separator } from '@/shared/ui';

import styles from '../../DatasetChartBuilder.module.scss';

type BuilderActionsProps = {
    canPreview: boolean;
    editMode: boolean;
    isSaving: boolean;
    onSaveWithoutPreview: () => void;
    previewLoading: boolean;
};

export const BuilderActions = ({
    canPreview,
    editMode,
    isSaving,
    onSaveWithoutPreview,
    previewLoading,
}: BuilderActionsProps) => (
    <>
        <Separator className={styles['actions-separator']} />
        <div className={styles['actions']} data-stack="h" data-gap="sm" data-wrap="wrap">
            <Button
                type="submit"
                disabled={!canPreview || previewLoading}
                isLoading={previewLoading}
            >
                <Play size={18} />
                Preview
            </Button>
            {editMode && (
                <Button
                    type="button"
                    disabled={!canPreview || isSaving}
                    isLoading={isSaving}
                    onClick={onSaveWithoutPreview}
                >
                    <Save size={18} />
                    Save
                </Button>
            )}
        </div>
    </>
);
