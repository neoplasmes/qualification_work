import { m } from 'motion/react';
import { NavLink } from 'react-router';

import styles from './NavBar.module.scss';

const navLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/datasets', label: 'Datasets' },
    { to: '/models', label: 'Models' },
    { to: '/settings', label: 'Settings' },
];

export const NavBar = () => {
    return (
        <header data-stack="h">
            <nav data-stack="h">
                <ul>
                    {navLinks.map(({ to, label }) => (
                        <div className={styles['link-wrapper']}>
                            <NavLink
                                key={to}
                                to={to}
                                className={l =>
                                    `${styles['link']} pb-8 ${l.isActive ? styles['active'] : ''}`
                                }
                            >
                                {label}
                            </NavLink>
                            <m.div
                                className={styles['active-link']}
                                layoutId="active-link-header"
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                    ))}
                </ul>
            </nav>
        </header>
    );
};
