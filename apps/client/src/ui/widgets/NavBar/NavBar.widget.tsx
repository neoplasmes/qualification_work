import { useActiveOrganization, useLogout, useSession } from '@/ui/session';
import { usePanelLayout, usePanelLayoutActions } from '@/ui/widgets/WorkspaceGrid';
import {
    HStack,
    IconButton,
    Link,
    Select,
    Text,
} from '@qualification-work/design-system';
import { LogOut, PanelLeft, PanelRight, User } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router';

import styles from './navBar.widget.module.css';

const navLinks = [
    { to: '/datasets', label: 'Таблицы' },
    { to: '/charts', label: 'Графики' },
    { to: '/actions', label: 'Действия' },
    { to: '/dashboards', label: 'Дашборды' },
];
export function NavBar() {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const { toggleLeftPanel, toggleRightPanel } = usePanelLayoutActions();
    const isLeftCollapsed = usePanelLayout(state => state.isLeftCollapsed);
    const isRightCollapsed = usePanelLayout(state => state.isRightCollapsed);
    const me = useSession();
    const { activeOrg, orgs, setActiveOrgId } = useActiveOrganization(me.data);
    const logout = useLogout();
    const workspace = navLinks.some(
        link => pathname === link.to || pathname.startsWith(link.to + '/')
    );

    return (
        <header className={styles.header}>
            <Text variant="heading-sm" className={styles.brand}>
                BI Tool
            </Text>
            <HStack
                as="nav"
                gap={4}
                wrap
                aria-label="Main navigation"
                className={styles.navigation}
            >
                {navLinks.map(({ to, label }) => (
                    <Link as={NavLink} key={to} to={to} block className={styles.link}>
                        {label}
                    </Link>
                ))}
            </HStack>
            <HStack gap={8} wrap className={styles.controls}>
                <Select
                    aria-label="Рабочее пространство"
                    data-testid="workspace-select"
                    className={styles.organization}
                    value={activeOrg?.id ?? ''}
                    disabled={!orgs.length}
                    onChange={event => setActiveOrgId(event.target.value)}
                >
                    {!orgs.length && <option value="">Нет рабочего пространства</option>}
                    {orgs.map(org => (
                        <option key={org.id} value={org.id}>
                            {org.name}
                        </option>
                    ))}
                </Select>
                {workspace && (
                    <>
                        <IconButton
                            aria-label={
                                isLeftCollapsed ? 'Show left panel' : 'Hide left panel'
                            }
                            aria-pressed={!isLeftCollapsed}
                            onClick={toggleLeftPanel}
                        >
                            <PanelLeft size={18} />
                        </IconButton>
                        <IconButton
                            aria-label={
                                isRightCollapsed ? 'Show right panel' : 'Hide right panel'
                            }
                            aria-pressed={!isRightCollapsed}
                            onClick={toggleRightPanel}
                        >
                            <PanelRight size={18} />
                        </IconButton>
                    </>
                )}
                <IconButton aria-label="Profile" onClick={() => navigate('/profile')}>
                    <User size={18} />
                </IconButton>
                <IconButton
                    aria-label="Sign out"
                    disabled={logout.isPending}
                    aria-busy={logout.isPending}
                    onClick={() => void logout.execute()}
                >
                    <LogOut size={18} />
                </IconButton>
            </HStack>
        </header>
    );
}
