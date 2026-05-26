import { LazyMotion } from 'motion/react';
import { Outlet, useLocation } from 'react-router';

import { NavBar } from '../NavBar';

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
            <div
                data-stack="v"
                data-gap="md"
                data-p="md"
                style={{ height: '100vh', overflow: 'hidden' }}
            >
                <NavBar />
                <Outlet />
            </div>
        </LazyMotion>
    );
};
