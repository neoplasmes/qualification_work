import {
    ChartNoAxesColumnIncreasing,
    LogOut,
    LayoutDashboard,
    PanelLeft,
    PanelRight,
    TableProperties,
    User,
} from 'lucide-react';
import { m } from 'motion/react';
import { type FC } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';

import { useActiveOrganization, useGetMeQuery, useLogoutMutation } from '@/features/auth';
import { getApiErrorMessage } from '@/shared/api';
import { IconButton, IconButtonLink, Logo } from '@/shared/ui';
import {
    toggleLeftPanel,
    toggleRightPanel,
    selectIsLeftCollapsed,
    selectIsRightCollapsed,
} from '@/widgets/WorkspaceGrid';

import styles from './NavBar.module.scss';

const navLinks = [
    { to: '/datasets', label: 'Datasets', Icon: TableProperties },
    { to: '/charts', label: 'Charts', Icon: ChartNoAxesColumnIncreasing },
    { to: '/dashboards', label: 'Dashboards', Icon: LayoutDashboard },
];

const workspacePaths = new Set(['/datasets', '/charts', '/dashboards']);

export const NavBar: FC = () => {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();

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
                <label className={styles['workspace-select']}>
                    <span>Workspace</span>
                    <select
                        data-testid="workspace-select"
                        value={activeOrg?.id ?? ''}
                        disabled={orgs.length === 0}
                        onChange={event => setActiveOrgId(event.target.value)}
                    >
                        {orgs.length === 0 && <option value="">No workspace</option>}
                        {orgs.map(org => (
                            <option key={org.id} value={org.id}>
                                {org.name} ({org.role})
                            </option>
                        ))}
                    </select>
                </label>

                {isWorkspacePage && (
                    <>
                        <IconButton
                            aria-label={isLeftCollapsed ? 'Show left panel' : 'Hide left panel'}
                            aria-pressed={!isLeftCollapsed}
                            onClick={() => dispatch(toggleLeftPanel())}
                        >
                            <PanelLeft size={16} />
                        </IconButton>
                        <IconButton
                            aria-label={isRightCollapsed ? 'Show right panel' : 'Hide right panel'}
                            aria-pressed={!isRightCollapsed}
                            onClick={() => dispatch(toggleRightPanel())}
                        >
                            <PanelRight size={16} />
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
            </div>
        </header>
    );
};
