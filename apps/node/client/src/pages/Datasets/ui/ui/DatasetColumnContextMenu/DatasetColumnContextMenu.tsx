import type { DatasetColumn } from '@/entities/dataset';

import { Checkbox, ContextMenu } from '@/shared/ui';

import { datasetsTestIds } from '../../../const';

import styles from './DatasetColumnContextMenu.module.scss';

export type DatasetColumnContextMenuState = {
    column: DatasetColumn;
    x: number;
    y: number;
};

type DatasetColumnContextMenuProps = {
    state: DatasetColumnContextMenuState;
    disabled: boolean;
    onToggleAnalysis: (column: DatasetColumn, value: boolean) => void;
    onCancel: () => void;
};

export const DatasetColumnContextMenu = ({
    state,
    disabled,
    onToggleAnalysis,
    onCancel,
}: DatasetColumnContextMenuProps) => (
    <ContextMenu
        x={state.x}
        y={state.y}
        data-test-id={datasetsTestIds.columnContextMenu}
        onCancel={onCancel}
    >
        <div className={styles['content']}>
            <Checkbox
                data-test-id={datasetsTestIds.includeColumnInAnalysisCheckbox}
                label="Include in analysis"
                checked={state.column.isAnalyzable !== false}
                disabled={disabled}
                onChange={event => onToggleAnalysis(state.column, event.target.checked)}
            />
        </div>
    </ContextMenu>
);
