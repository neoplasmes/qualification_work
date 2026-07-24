import type { DatasetColumn } from '@/core/entities/datasetColumn';
import { filterOpLabels } from '@/ui/widgets/ChartShell';
import { Field } from '@qualification-work/design-system';
import { filterOperations, type FilterOperation } from '@qualification-work/types';

import type { Config, ConfigBind, ConfigFieldKey } from '@/shared/ui/tools/Config';

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
            <Field label="Filter column">
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
            </Field>

            <Field label="Condition">
                <config.Select field={operationField}>
                    {filterOperations.map(operation => (
                        <option key={operation} value={operation}>
                            {filterOpLabels[operation]}
                        </option>
                    ))}
                </config.Select>
            </Field>

            {!isNullaryFilterOperation(operation) && (
                <Field label="Value">
                    <config.Input
                        field={valueField}
                        placeholder={filterValuePlaceholder}
                    />
                </Field>
            )}
        </config.Section>
    );
};
