import { Suspense, useState } from 'react';
import { NavLink, Outlet } from 'react-router';

import { TestStyleModules } from '@/widgets/TestStyleModules';

import classes from './Layout.module.scss';

export const Layout = () => {
    const [state, setState] = useState(1);

    return (
        <div className={classes.layout}>
            <header className={classes.header}>
                <nav className={classes.nav}>
                    <NavLink
                        to="/"
                        style={({ isActive }) => ({
                            fontWeight: isActive ? 'bold' : 'normal',
                        })}
                    >
                        main
                    </NavLink>
                    <NavLink
                        to="/lazy"
                        style={({ isActive }) => ({
                            fontWeight: isActive ? 'bold' : 'normal',
                        })}
                    >
                        lazy load
                    </NavLink>
                </nav>
                <button onClick={() => setState(prev => prev + 1)}>{state}</button>
            </header>
            <main className={classes.main}>
                <TestStyleModules />
                <Suspense fallback={<div>loading...</div>}>
                    <Outlet />
                </Suspense>
            </main>
        </div>
    );
};
