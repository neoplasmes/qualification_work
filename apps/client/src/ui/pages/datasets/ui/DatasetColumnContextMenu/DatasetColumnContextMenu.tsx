import type { DatasetColumn } from '@/core/entities/datasetColumn';
import { Checkbox } from '@qualification-work/design-system';

import { ContextMenu } from '@/shared/ui';

import { datasetsTestIds } from '../../const';

import styles from './datasetColumnContextMenu.module.css';

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
        className={styles.menu}
        onCancel={onCancel}
    >
        <label className={styles['content']}>
            <Checkbox
                data-test-id={datasetsTestIds.includeColumnInAnalysisCheckbox}
                checked={state.column.isAnalyzable !== false}
                disabled={disabled}
                onChange={event => onToggleAnalysis(state.column, event.target.checked)}
            />
            Использовать в анализе
        </label>
    </ContextMenu>
);
