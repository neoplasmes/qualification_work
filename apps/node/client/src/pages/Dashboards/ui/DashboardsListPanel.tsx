import { LayoutDashboard, Plus } from 'lucide-react';
import { useState } from 'react';

import type { Dashboard } from '@/features/dashboards';
import { getApiErrorMessage } from '@/shared/api';
import { Button } from '@/shared/ui';
import { formatDate } from '@/shared/lib/formatDate';

import styles from './DashboardsPage.module.scss';

type DashboardsListPanelProps = {
    dashboards: Dashboard[] | undefined;
    loading: boolean;
    selectedDashboard: Dashboard | undefined;
    creating: boolean;
    onSelect: (id: string) => void;
    onCreate: (name: string) => Promise<void>;
};

export const DashboardsListPanel = ({
    dashboards,
    loading,
    selectedDashboard,
    creating,
    onSelect,
    onCreate,
}: DashboardsListPanelProps) => {
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmed = name.trim();
        if (!trimmed) {
            setError('Dashboard name can not be empty.');

            return;
        }

        setError('');

        try {
            await onCreate(trimmed);
            setName('');
        } catch (createError) {
            setError(
                getApiErrorMessage(createError, 'Unable to create this dashboard.')
            );
        }
    };

    return (
        <aside className={styles['panel']}>
            <div data-stack="v" data-gap="xs">
                <span className={styles['eyebrow']}>Workspace</span>
                <h1 className={styles['title']}>Dashboards</h1>
                <p className={styles['muted']}>
                    {dashboards?.length ?? 0} dashboards
                </p>
            </div>

            <form className={styles['create-form']} onSubmit={handleSubmit}>
                <label className={styles['control']}>
                    <span>New dashboard</span>
                    <input
                        value={name}
                        placeholder="Sales overview"
                        onChange={event => setName(event.target.value)}
                    />
                </label>
                <Button type="submit" disabled={creating}>
                    <Plus size={18} />
                    Create
                </Button>
            </form>

            {error && (
                <div role="alert" className={`${styles['status']} ${styles['error']}`}>
                    {error}
                </div>
            )}

            <section className={styles['dashboard-list']} aria-label="Dashboards">
                {loading && (
                    <div className={styles['status']}>Loading dashboards...</div>
                )}
                {dashboards?.length === 0 && (
                    <div className={styles['empty']}>
                        Create a dashboard to arrange saved charts.
                    </div>
                )}
                {dashboards?.map(item => (
                    <button
                        type="button"
                        key={item.id}
                        className={`${styles['dashboard-item']} ${
                            selectedDashboard?.id === item.id ? styles['selected'] : ''
                        }`}
                        onClick={() => onSelect(item.id)}
                    >
                        <div>
                            <div className={styles['dashboard-name']}>{item.name}</div>
                            <div className={styles['dashboard-meta']}>
                                <span>{item.items?.length ?? 0} widgets</span>
                                <span>{formatDate(item.createdAt)}</span>
                            </div>
                        </div>
                        <LayoutDashboard size={18} />
                    </button>
                ))}
            </section>
        </aside>
    );
};
