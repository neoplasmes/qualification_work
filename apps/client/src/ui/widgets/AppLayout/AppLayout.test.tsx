import { render, screen } from '@testing-library/react';
import { MotionConfigContext } from 'motion/react';
import { useContext } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { expect, it, vi } from 'vitest';

import { Layout } from './AppLayout.widget';

vi.mock('./model', () => ({ usePersistedStateHydration: vi.fn() }));
vi.mock('@/ui/widgets/NavBar', () => ({ NavBar: () => null }));

function MotionPolicy() {
    return <output>{useContext(MotionConfigContext).reducedMotion}</output>;
}

it.each(['/sign-in', '/dashboards'])('inherits user motion preference at %s', path => {
    const router = createMemoryRouter(
        [{ element: <Layout />, children: [{ path, element: <MotionPolicy /> }] }],
        { initialEntries: [path] }
    );
    render(<RouterProvider router={router} />);
    expect(screen.getByRole('status')).toHaveTextContent('user');
});
