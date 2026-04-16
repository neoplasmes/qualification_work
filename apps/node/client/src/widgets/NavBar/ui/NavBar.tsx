import { m } from 'motion/react';
import type { FC } from 'react';
import { NavLink, useLocation } from 'react-router';

import { Logo } from '@/shared/ui';

import styles from './NavBar.module.scss';

const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/datasets', label: 'Datasets' },
    { to: '/charts', label: 'Charts' },
    { to: '/dashboards', label: 'Dashboards' },
];

export const NavBar: FC = () => {
    const { pathname } = useLocation();

    return (
        <header data-stack="h" data-align="center" data-justify="between">
            <Logo text="" />
            <nav>
                <ul data-stack="h" data-gap="md">
                    {navLinks.map(({ to, label }) => (
                        <div key={to} className={styles['link-wrapper']}>
                            <NavLink
                                to={to}
                                className={l =>
                                    `${styles['link']} pb-8 ${l.isActive ? styles['active'] : ''}`
                                }
                            >
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
            <div>user panel</div>
        </header>
    );
};
