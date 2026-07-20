import { Select } from '@qualification-work/design-system';

import type { DatasetMetadata } from '@/entities/dataset';

type SelectProps = {
    value: string;
    disabled: boolean;
    testId: string;
    onChange: (value: string) => void;
};

type ColumnSelectProps = SelectProps & {
    columns: DatasetMetadata['columns'];
};

export const ColumnSelect = ({
    columns,
    value,
    disabled,
    testId,
    onChange,
}: ColumnSelectProps) => (
    <Select
        data-test-id={testId}
        value={value}
        disabled={disabled}
        onChange={event => onChange(event.target.value)}
    >
        <option value="">Select column</option>
        {columns.map(column => (
            <option key={column.key} value={column.key}>
                {column.displayName}
            </option>
        ))}
    </Select>
);
