import { Plus } from 'lucide-react';

import type { Chart } from '@/entities/chart';

import { Button } from '@/shared/ui';

import { dashboardsTestIds } from '../../../const';

import styles from './AddChartForm.module.scss';

type AddChartFormProps = {
    charts: Chart[] | undefined;
    value: string;
    disabled: boolean;
    onChange: (value: string) => void;
    onAdd: () => void;
};

export const AddChartForm = ({
    charts,
    value,
    disabled,
    onChange,
    onAdd,
}: AddChartFormProps) => (
    <div className={styles['add-chart']}>
        <label className={styles['control']}>
            <span>Add saved chart</span>
            <select
                data-test-id={dashboardsTestIds.addChartSelect}
                value={value}
                onChange={event => onChange(event.target.value)}
            >
                {charts?.map(chart => (
                    <option key={chart.id} value={chart.id}>
                        {chart.name}
                    </option>
                ))}
            </select>
        </label>
        <Button
            data-test-id={dashboardsTestIds.addChartButton}
            disabled={!value || disabled}
            onClick={onAdd}
        >
            <Plus size={18} />
            Add chart
        </Button>
    </div>
);
