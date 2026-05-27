import {
    ChartNoAxesColumnIncreasing,
    LayoutDashboard,
    LogOut,
    PanelLeft,
    PanelRight,
    TableProperties,
    User,
    Workflow,
} from 'lucide-react';
import { m } from 'motion/react';
import { type FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useLocation, useNavigate } from 'react-router';

import {
    selectIsLeftCollapsed,
    selectIsRightCollapsed,
    toggleLeftPanel,
    toggleRightPanel,
} from '@/widgets/WorkspaceGrid';

import {
    useActiveOrganization,
    useGetMeQuery,
    useLogoutMutation,
} from '@/features/authenticate';

import { useHasMounted } from '@/shared/lib/useHasMounted';
import { FormField, IconButton, Logo, Select } from '@/shared/ui';

import styles from './NavBar.module.scss';

const navLinks = [
    { to: '/datasets', label: 'Datasets', Icon: TableProperties },
    { to: '/charts', label: 'Charts', Icon: ChartNoAxesColumnIncreasing },
    { to: '/dashboards', label: 'Dashboards', Icon: LayoutDashboard },
    { to: '/actions', label: 'Actions', Icon: Workflow },
];

const workspacePaths = new Set(['/datasets', '/charts', '/dashboards', '/actions']);

export const NavBar: FC = () => {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const hasMounted = useHasMounted();

    const isLeftCollapsed = useSelector(selectIsLeftCollapsed);
    const isRightCollapsed = useSelector(selectIsRightCollapsed);

    const meQuery = useGetMeQuery();
    const { activeOrg, orgs, setActiveOrgId } = useActiveOrganization(meQuery.data);
    const [logout, logoutState] = useLogoutMutation();

    const handleLogout = async () => {
        try {
            await logout().unwrap();
        } catch {
            // ignore logout errors
        } finally {
            navigate('/sign-in', { replace: true });
        }
    };

    const isWorkspacePage = workspacePaths.has(pathname);
    const workspaceOrgs = hasMounted ? orgs : [];
    const workspaceValue = hasMounted ? (activeOrg?.id ?? '') : '';
    const workspaceDisabled = hasMounted ? orgs.length === 0 : false;

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
            <div
                className={styles['workspace-controls']}
                data-stack="h"
                data-gap="xs"
                data-align="center"
            >
                <FormField
                    label="Workspace"
                    className={styles['workspace-select']}
                    data-stack="h"
                    data-align="center"
                >
                    <Select
                        data-testid="workspace-select"
                        value={workspaceValue}
                        disabled={workspaceDisabled}
                        onChange={event => setActiveOrgId(event.target.value)}
                    >
                        {workspaceOrgs.length === 0 && (
                            <option value="">No workspace</option>
                        )}
                        {workspaceOrgs.map(org => (
                            <option key={org.id} value={org.id}>
                                {org.name} ({org.role})
                            </option>
                        ))}
                    </Select>
                </FormField>

                {isWorkspacePage && (
                    <>
                        <IconButton
                            tone="nav"
                            iconStrokeWidth={2.6}
                            aria-label={
                                isLeftCollapsed ? 'Show left panel' : 'Hide left panel'
                            }
                            aria-pressed={!isLeftCollapsed}
                            onClick={() => dispatch(toggleLeftPanel())}
                        >
                            <PanelLeft size={16} />
                        </IconButton>
                        <IconButton
                            tone="nav"
                            iconStrokeWidth={2.6}
                            aria-label={
                                isRightCollapsed ? 'Show right panel' : 'Hide right panel'
                            }
                            aria-pressed={!isRightCollapsed}
                            onClick={() => dispatch(toggleRightPanel())}
                        >
                            <PanelRight size={16} />
                        </IconButton>
                    </>
                )}

                <IconButton
                    tone="nav"
                    iconStrokeWidth={2.6}
                    aria-label="Profile"
                    onClick={() => navigate('/profile')}
                >
                    <User size={16} />
                </IconButton>
                <IconButton
                    tone="nav"
                    iconStrokeWidth={2.6}
                    aria-label="Sign out"
                    disabled={logoutState.isLoading}
                    onClick={() => void handleLogout()}
                >
                    <LogOut size={16} />
                </IconButton>
            </div>
        </header>
    );
};
