import { RefreshCcw, Save } from 'lucide-react';
import type { FormEvent } from 'react';

import { Button, FormField, TextInput } from '@/shared/ui';

import { dashboardsTestIds } from '../../../const';

import styles from './DashboardNameForm.module.scss';

type DashboardNameFormProps = {
    value: string;
    originalName: string;
    saving: boolean;
    refreshing: boolean;
    onChange: (value: string) => void;
    onRefresh: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export const DashboardNameForm = ({
    value,
    originalName,
    saving,
    refreshing,
    onChange,
    onRefresh,
    onSubmit,
}: DashboardNameFormProps) => (
    <form
        className={styles['edit-form']}
        data-test-id={dashboardsTestIds.renameForm}
        onSubmit={onSubmit}
    >
        <FormField label="Name">
            <TextInput
                data-test-id={dashboardsTestIds.renameInput}
                value={value}
                onChange={event => onChange(event.target.value)}
            />
        </FormField>
        <Button
            type="submit"
            data-test-id={dashboardsTestIds.saveNameButton}
            disabled={saving || value.trim() === originalName}
        >
            <Save size={18} />
            Save name
        </Button>
        <Button
            data-test-id={dashboardsTestIds.refreshButton}
            disabled={refreshing}
            onClick={onRefresh}
        >
            <RefreshCcw size={18} />
            Refresh
        </Button>
    </form>
);
