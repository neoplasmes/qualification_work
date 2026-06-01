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
    actionsWorkspaceIndexPath,
    getActionWorkspaceUrl,
    isActionsWorkspacePath,
    selectActionsWorkspaceMode,
    selectSelectedActionId,
} from '@/pages/Actions';
import {
    chartsWorkspaceIndexPath,
    getChartWorkspaceUrl,
    isChartsWorkspacePath,
    selectChartsWorkspaceMode,
    selectSelectedChartId,
} from '@/pages/Charts';
import {
    dashboardsWorkspaceIndexPath,
    getDashboardWorkspaceUrl,
    selectSelectedDashboardId,
} from '@/pages/Dashboards';

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
    {
        to: chartsWorkspaceIndexPath,
        label: 'Charts',
        Icon: ChartNoAxesColumnIncreasing,
    },
    {
        to: dashboardsWorkspaceIndexPath,
        label: 'Dashboards',
        Icon: LayoutDashboard,
    },
    { to: actionsWorkspaceIndexPath, label: 'Actions', Icon: Workflow },
];

const workspacePaths = new Set(['/datasets', '/dashboards']);

const isActiveNavPath = (pathname: string, linkPath: string) => {
    if (linkPath === chartsWorkspaceIndexPath) {
        return isChartsWorkspacePath(pathname);
    }

    if (linkPath === actionsWorkspaceIndexPath) {
        return isActionsWorkspacePath(pathname);
    }

    return pathname === linkPath;
};

export const NavBar: FC = () => {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const hasMounted = useHasMounted();

    const isLeftCollapsed = useSelector(selectIsLeftCollapsed);
    const isRightCollapsed = useSelector(selectIsRightCollapsed);
    const selectedChartId = useSelector(selectSelectedChartId);
    const chartsWorkspaceMode = useSelector(selectChartsWorkspaceMode);
    const selectedActionId = useSelector(selectSelectedActionId);
    const actionsWorkspaceMode = useSelector(selectActionsWorkspaceMode);
    const selectedDashboardId = useSelector(selectSelectedDashboardId);

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

    const chartsLink = selectedChartId
        ? getChartWorkspaceUrl(selectedChartId, chartsWorkspaceMode)
        : chartsWorkspaceIndexPath;
    const actionsLink = selectedActionId
        ? getActionWorkspaceUrl(selectedActionId, actionsWorkspaceMode)
        : actionsWorkspaceIndexPath;
    const dashboardsLink = selectedDashboardId
        ? getDashboardWorkspaceUrl(selectedDashboardId)
        : dashboardsWorkspaceIndexPath;
    const isWorkspacePage =
        workspacePaths.has(pathname) ||
        isChartsWorkspacePath(pathname) ||
        isActionsWorkspacePath(pathname);
    const workspaceOrgs = hasMounted ? orgs : [];
    const workspaceValue = hasMounted ? (activeOrg?.id ?? '') : '';
    const workspaceDisabled = hasMounted ? orgs.length === 0 : false;

    return (
        <header data-stack="h" data-align="center" data-justify="between">
            <Logo text="BI TOOL" />
            <nav aria-label="Main navigation">
                <ul data-stack="h" data-gap="sm">
                    {navLinks.map(({ to, label, Icon }) => {
                        let href = to;

                        if (to === chartsWorkspaceIndexPath) {
                            href = chartsLink;
                        }

                        if (to === actionsWorkspaceIndexPath) {
                            href = actionsLink;
                        }

                        if (to === dashboardsWorkspaceIndexPath) {
                            href = dashboardsLink;
                        }

                        const active = isActiveNavPath(pathname, to);

                        return (
                            <div key={to} data-stack="v">
                                <NavLink
                                    to={href}
                                    className={`${styles['link']} ${
                                        active ? styles['active'] : ''
                                    }`}
                                >
                                    <Icon size={17} />
                                    {label}
                                </NavLink>
                                {active && (
                                    <m.div
                                        className={styles['active-link']}
                                        layoutId="active-link-header"
                                        transition={{ duration: 0.3 }}
                                    />
                                )}
                            </div>
                        );
                    })}
                </ul>
            </nav>
            <div
                className={styles['workspace-controls']}
                data-stack="h"
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
                                {org.name}
                            </option>
                        ))}
                    </Select>
                </FormField>

                {isWorkspacePage && (
                    <>
                        <IconButton
                            tone="nav"
                            className={styles['panel-toggle']}
                            iconStrokeWidth={2.6}
                            data-px="xs"
                            aria-label={
                                isLeftCollapsed ? 'Show left panel' : 'Hide left panel'
                            }
                            aria-pressed={!isLeftCollapsed}
                            onClick={() => dispatch(toggleLeftPanel())}
                        >
                            <PanelLeft size={18} />
                        </IconButton>
                        <IconButton
                            tone="nav"
                            className={styles['panel-toggle']}
                            iconStrokeWidth={2.6}
                            data-px="xs"
                            aria-label={
                                isRightCollapsed ? 'Show right panel' : 'Hide right panel'
                            }
                            aria-pressed={!isRightCollapsed}
                            onClick={() => dispatch(toggleRightPanel())}
                        >
                            <PanelRight size={18} />
                        </IconButton>
                    </>
                )}

                <IconButton
                    tone="nav"
                    iconStrokeWidth={2.6}
                    data-px="xs"
                    aria-label="Profile"
                    onClick={() => navigate('/profile')}
                >
                    <User size={18} />
                </IconButton>
                <IconButton
                    tone="nav"
                    iconStrokeWidth={2.6}
                    data-px="xs"
                    aria-label="Sign out"
                    disabled={logoutState.isLoading}
                    onClick={() => void handleLogout()}
                >
                    <LogOut size={18} />
                </IconButton>
            </div>
        </header>
    );
};
