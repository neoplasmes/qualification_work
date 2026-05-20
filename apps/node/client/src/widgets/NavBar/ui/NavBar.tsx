import {
    ChartNoAxesColumnIncreasing,
    LogOut,
    LayoutDashboard,
    Plus,
    Save,
    TableProperties,
    Trash2,
    User,
    X,
} from 'lucide-react';
import { m } from 'motion/react';
import { useId, useState, type FC, type FormEvent } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router';

import { useActiveOrganization, useGetMeQuery, useLogoutMutation } from '@/features/auth';
import { useCreateOrgMutation, useDeleteOrgMutation } from '@/features/orgs';
import { getApiErrorMessage } from '@/shared/api';
import { IconButton, IconButtonLink, Logo } from '@/shared/ui';

import styles from './NavBar.module.scss';

const navLinks = [
    { to: '/datasets', label: 'Datasets', Icon: TableProperties },
    { to: '/charts', label: 'Charts', Icon: ChartNoAxesColumnIncreasing },
    { to: '/dashboards', label: 'Dashboards', Icon: LayoutDashboard },
];

export const NavBar: FC = () => {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const createOrgInputId = useId();
    const [isCreatingOrg, setIsCreatingOrg] = useState(false);
    const [orgName, setOrgName] = useState('');
    const [error, setError] = useState('');
    const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(
        null
    );

    const meQuery = useGetMeQuery();
    const { activeOrg, orgs, setActiveOrgId, clearActiveOrg } = useActiveOrganization(
        meQuery.data
    );
    const [logout, logoutState] = useLogoutMutation();
    const [createOrg, createOrgState] = useCreateOrgMutation();
    const [deleteOrg, deleteOrgState] = useDeleteOrgMutation();

    const handleCreateOrg = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!meQuery.data) {
            return;
        }

        const displayName = orgName.trim();
        if (!displayName) {
            setError('Workspace name can not be empty.');

            return;
        }

        const name = displayName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 48) || `workspace-${Date.now()}`;

        try {
            const result = await createOrg({
                name,
                displayName,
                ownerId: meQuery.data.id,
            }).unwrap();
            setActiveOrgId(result.id);
            setOrgName('');
            setIsCreatingOrg(false);
            setError('');
            await meQuery.refetch();
        } catch (createError) {
            setError(getApiErrorMessage(createError, 'Unable to create workspace.'));
        }
    };

    const handleDeleteOrg = async () => {
        if (!activeOrg) {
            return;
        }

        if (deleteConfirmationId !== activeOrg.id) {
            setDeleteConfirmationId(activeOrg.id);

            return;
        }

        try {
            await deleteOrg(activeOrg.id).unwrap();
            setDeleteConfirmationId(null);
            setError('');
            await meQuery.refetch();
        } catch (deleteError) {
            setError(getApiErrorMessage(deleteError, 'Unable to delete workspace.'));
        }
    };

    const handleLogout = async () => {
        try {
            await logout().unwrap();
        } finally {
            clearActiveOrg();
            navigate('/sign-in', { replace: true });
        }
    };

    return (
        <header data-stack="h" data-align="center" data-justify="between">
            <Logo text="" />
            <nav aria-label="Main navigation">
                <ul data-stack="h" data-gap="sm">
                    {navLinks.map(({ to, label, Icon }) => (
                        <div key={to} className={styles['link-wrapper']}>
                            <NavLink
                                to={to}
                                className={l =>
                                    `${styles['link']} pb-8 ${l.isActive ? styles['active'] : ''}`
                                }
                            >
                                <Icon size={17} />
                                {label}
                            </NavLink>
                            {pathname === to && (
                                <m.div
                                    className={styles['active-link']}
                                    layoutId="active-link-header"
                                    transition={{ duration: 0.3 }}
                                />
                            )}
                        </div>
                    ))}
                </ul>
            </nav>
            <div className={styles['workspace-controls']}>
                {isCreatingOrg ? (
                    <form
                        className={styles['workspace-form']}
                        aria-label="Create workspace"
                        onSubmit={handleCreateOrg}
                    >
                        <label htmlFor={createOrgInputId}>Workspace</label>
                        <input
                            id={createOrgInputId}
                            value={orgName}
                            placeholder="Analytics team"
                            disabled={createOrgState.isLoading}
                            onChange={event => setOrgName(event.target.value)}
                        />
                        <IconButton
                            type="submit"
                            aria-label="Save workspace"
                            disabled={createOrgState.isLoading}
                        >
                            <Save size={16} />
                        </IconButton>
                        <IconButton
                            aria-label="Cancel workspace creation"
                            onClick={() => {
                                setIsCreatingOrg(false);
                                setOrgName('');
                                setError('');
                            }}
                        >
                            <X size={16} />
                        </IconButton>
                    </form>
                ) : (
                    <>
                        <label className={styles['workspace-select']}>
                            <span>Workspace</span>
                            <select
                                data-testid="workspace-select"
                                value={activeOrg?.id ?? ''}
                                disabled={orgs.length === 0}
                                onChange={event => {
                                    setActiveOrgId(event.target.value);
                                    setDeleteConfirmationId(null);
                                }}
                            >
                                {orgs.length === 0 && (
                                    <option value="">No workspace</option>
                                )}
                                {orgs.map(org => (
                                    <option key={org.id} value={org.id}>
                                        {org.name} ({org.role})
                                    </option>
                                ))}
                            </select>
                        </label>
                        <IconButton
                            aria-label="Create workspace"
                            onClick={() => {
                                setIsCreatingOrg(true);
                                setDeleteConfirmationId(null);
                            }}
                        >
                            <Plus size={16} />
                        </IconButton>
                        <IconButton
                            aria-label={
                                deleteConfirmationId === activeOrg?.id
                                    ? 'Confirm delete workspace'
                                    : 'Delete workspace'
                            }
                            disabled={!activeOrg || deleteOrgState.isLoading}
                            onClick={() => void handleDeleteOrg()}
                        >
                            <Trash2 size={16} />
                        </IconButton>
                    </>
                )}
                <IconButtonLink to="/profile" aria-label="Profile">
                    <User size={16} />
                </IconButtonLink>
                <IconButton
                    aria-label="Sign out"
                    disabled={logoutState.isLoading}
                    onClick={() => void handleLogout()}
                >
                    <LogOut size={16} />
                </IconButton>
                {error && (
                    <div role="alert" className={styles['workspace-error']}>
                        {error}
                    </div>
                )}
            </div>
        </header>
    );
};
