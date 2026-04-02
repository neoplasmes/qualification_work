import { LazyMotion, m } from 'motion/react';
import { NavLink, Outlet, useLocation } from 'react-router';

import styles from './Layout.module.scss';

const motionFeatures = () =>
    import('../../config/motionFeatures').then(res => res.domMax);

export const Layout = () => {
    const location = useLocation();

    if (location.pathname === '/sign-in' || location.pathname === '/sign-up') {
        return (
            <LazyMotion features={motionFeatures} strict>
                <Outlet />
            </LazyMotion>
        );
    }

    // TODO: Layout для основной части приложения
    return (
        <LazyMotion features={motionFeatures} strict>
            <div data-stack="v">
                <div></div>
                <Outlet />
            </div>
        </LazyMotion>
    );
};
