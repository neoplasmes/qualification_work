import type { DatasetMetadata } from '@/entities/dataset';

import { Select } from '@/shared/ui';

import type { ActionParameterDraft } from '../../../model';

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

type ParameterSelectProps = SelectProps & {
    parameters: ActionParameterDraft[];
};

export const ParameterSelect = ({
    parameters,
    value,
    disabled,
    testId,
    onChange,
}: ParameterSelectProps) => (
    <Select
        data-test-id={testId}
        value={value}
        disabled={disabled}
        onChange={event => onChange(event.target.value)}
    >
        <option value="">Select parameter</option>
        {parameters
            .filter(parameter => parameter.key.trim())
            .map(parameter => (
                <option key={parameter.id} value={parameter.key.trim()}>
                    {parameter.label.trim() || parameter.key.trim()}
                </option>
            ))}
    </Select>
);
