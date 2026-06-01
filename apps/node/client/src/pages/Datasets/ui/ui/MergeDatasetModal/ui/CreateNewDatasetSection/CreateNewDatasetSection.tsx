import { useId } from 'react';

import { Explain, FormField, Separator, Switch, TextInput } from '@/shared/ui';

import { datasetsTestIds } from '../../../../../const';

import styles from './CreateNewDatasetSection.module.scss';

type CreateNewDatasetSectionProps = {
    checked: boolean;
    datasetName: string;
    placeholderName: string;
    onCheckedChange: (checked: boolean) => void;
    onDatasetNameChange: (value: string) => void;
};

export const CreateNewDatasetSection = ({
    checked,
    datasetName,
    placeholderName,
    onCheckedChange,
    onDatasetNameChange,
}: CreateNewDatasetSectionProps) => {
    const labelId = useId();

    return (
        <section data-stack="v" data-gap="sm">
            <div data-stack="h" data-gap="sm" data-align="center">
                <Separator
                    style={{
                        flexGrow: 1,
                        width: 'auto',
                    }}
                />
                <div data-stack="h" data-gap="xs" data-align="center">
                    <span id={labelId} className={styles['label']}>
                        Create new dataset
                    </span>
                    <Explain
                        label="Explain create new dataset"
                        description="Copy current rows first, then apply imported rows."
                    />
                </div>
                <Switch
                    aria-labelledby={labelId}
                    checked={checked}
                    onChange={event => onCheckedChange(event.currentTarget.checked)}
                />
            </div>

            {checked && (
                <FormField
                    label="Dataset name"
                    hint={`Leave empty to use "${placeholderName} copy".`}
                >
                    <TextInput
                        data-test-id={datasetsTestIds.mergeDatasetNameInput}
                        type="text"
                        placeholder={`${placeholderName} copy`}
                        value={datasetName}
                        onChange={event => onDatasetNameChange(event.target.value)}
                    />
                </FormField>
            )}
        </section>
    );
};
