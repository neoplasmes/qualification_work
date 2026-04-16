import { m, MotionConfig } from 'motion/react';
import { NavLink, useLocation } from 'react-router';

import { Banner } from './Banner/Banner';
import { SignIn } from './SignIn';
import { SignUp } from './SignUp';

import styles from './EntrancePage.module.scss';

const navLinks = [
    { to: '/sign-in', label: 'Sign in' },
    { to: '/sign-up', label: 'Sign up' },
];

export const Entrance = () => {
    const location = useLocation();
    const isSignUp = location.pathname === '/sign-up';

    return (
        <div
            data-stack="v"
            data-justify="center"
            data-align="center"
            className={styles['wrapper']}
        >
            <main data-stack="h" className={styles['entrance']}>
                <Banner />
                <MotionConfig
                    transition={{ duration: 0.5, ease: [0.77, 0, 0.18, 1] }}
                    reducedMotion="never"
                >
                    <section
                        data-stack="v"
                        data-py="lg"
                        data-pr="lg"
                        data-pl="md"
                        className={styles['content']}
                    >
                        <nav data-stack="h" className={styles['links']}>
                            <ul
                                data-gap="md-plus"
                                data-stack="h"
                                className={styles['links-list']}
                            >
                                {navLinks.map(({ to, label }) => (
                                    <li
                                        data-stack="v"
                                        key={to}
                                        className={`${styles['link-wrapper']}`}
                                    >
                                        <NavLink
                                            key={to}
                                            to={to}
                                            data-pb="xs"
                                            className={l =>
                                                `${styles['link']} ${l.isActive ? styles['active'] : ''}`
                                            }
                                        >
                                            {label}
                                        </NavLink>
                                        {to === location.pathname && (
                                            <m.div
                                                layoutId="active-link"
                                                initial={false}
                                                className={styles['active-link']}
                                            />
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </nav>
                        <div
                            data-stack="v"
                            data-pt="md"
                            data-pb="sm"
                            className={styles['carousel-viewport']}
                        >
                            <m.div
                                className={styles['carousel-track']}
                                initial={false}
                                animate={{
                                    x: isSignUp
                                        ? 'calc(-100% - var(--spacing-lg))'
                                        : 'calc(0% - 0px)',
                                }}
                            >
                                <div key="sign-in" className={styles['carousel-slide']}>
                                    <SignIn />
                                </div>
                                <div key="sign-up" className={styles['carousel-slide']}>
                                    <SignUp />
                                </div>
                            </m.div>
                        </div>
                    </section>
                </MotionConfig>
            </main>
        </div>
    );
};
