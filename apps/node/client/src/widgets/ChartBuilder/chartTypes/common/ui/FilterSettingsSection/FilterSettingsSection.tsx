import { filterOperations, type FilterOperation } from '@qualification-work/types';

import type { Config, ConfigBind, ConfigFieldKey } from '@/features/Config';

import { FILTER_OP_LABELS } from '@/entities/chart';
import type { DatasetColumn } from '@/entities/dataset';

import { FormField } from '@/shared/ui';

import { isNullaryFilterOperation } from '../../model';

type FilterSettingsSectionProps<T extends object> = {
    config: Config<T>;
    enabledField: ConfigFieldKey<T, boolean>;
    columnBind: ConfigBind<T, string>;
    operationField: ConfigFieldKey<T, FilterOperation>;
    valueField: ConfigFieldKey<T, string>;
    columns: DatasetColumn[];
};

export const FilterSettingsSection = <T extends object>({
    config,
    enabledField,
    columnBind,
    operationField,
    valueField,
    columns,
}: FilterSettingsSectionProps<T>) => {
    const snapshot = config.useConfig();
    const operation = snapshot.draft[operationField] as FilterOperation;
    let filterValuePlaceholder;

    if (operation === 'between') {
        filterValuePlaceholder = 'min, max';
    } else if (operation === 'in' || operation === 'nin') {
        filterValuePlaceholder = 'a, b, c';
    }

    return (
        <config.Section name="Filter" enabledField={enabledField}>
            <FormField label="Filter column">
                <config.Select bind={columnBind}>
                    {columns.map(column => (
                        <option
                            key={column.id}
                            value={column.id}
                            disabled={column.isAnalyzable === false}
                        >
                            {column.displayName}
                        </option>
                    ))}
                </config.Select>
            </FormField>

            <FormField label="Condition">
                <config.Select field={operationField}>
                    {filterOperations.map(operation => (
                        <option key={operation} value={operation}>
                            {FILTER_OP_LABELS[operation]}
                        </option>
                    ))}
                </config.Select>
            </FormField>

            {!isNullaryFilterOperation(operation) && (
                <FormField label="Value">
                    <config.Input
                        field={valueField}
                        placeholder={filterValuePlaceholder}
                    />
                </FormField>
            )}
        </config.Section>
    );
};
