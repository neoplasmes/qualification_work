import { ClientRoot } from '@/main/ClientRoot';
import { createDependencies } from '@/main/dependencies';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { createMemoryRouter } from 'react-router';
import { afterEach, expect, it, vi } from 'vitest';

import { SignIn } from '@/pages/Entrance/ui/SignIn';
import { SignUp } from '@/pages/Entrance/ui/SignUp';

const runtimes: ReturnType<typeof createDependencies>[] = [];
const routers: ReturnType<typeof createMemoryRouter>[] = [];

afterEach(async () => {
    cleanup();
    for (const router of routers.splice(0)) {
        router.dispose();
    }
    await Promise.all(runtimes.splice(0).map(runtime => runtime.dispose()));
    localStorage.clear();
    vi.unstubAllGlobals();
});

it.each([
    { page: 'Sign in', path: '/sign-in', endpoint: '/auth/login', leave: true },
    { page: 'Sign up', path: '/sign-up', endpoint: '/auth/register', leave: true },
    { page: 'Sign in', path: '/sign-in', endpoint: '/auth/login', leave: false },
    { page: 'Sign up', path: '/sign-up', endpoint: '/auth/register', leave: false },
])(
    'respects $page owner lifetime after command completion (departed: $leave)',
    async ({ page, path, endpoint, leave }) => {
        let finish!: (response: Response) => void;
        const requests: string[] = [];
        vi.stubGlobal(
            'fetch',
            vi.fn(async (url: string, init?: RequestInit) => {
                requests.push(url);
                if (url.endsWith(endpoint)) {
                    expect(init?.signal).toBeUndefined();

                    return new Promise<Response>(resolve => {
                        finish = resolve;
                    });
                }
                if (url.endsWith('/auth/login')) {
                    return new Response(null, { status: 204 });
                }

                return Response.json({
                    id: 'u',
                    email: 'a@b.com',
                    name: 'A',
                    family: 'B',
                    isInitializing: false,
                    organizations: [{ id: 'o', name: 'Org', role: 'owner' }],
                });
            })
        );
        const runtime = createDependencies({ platform: 'browser', apiBaseUrl: '/api' });
        runtimes.push(runtime);
        const router = createMemoryRouter(
            [
                { path: '/sign-in', element: <SignIn /> },
                { path: '/sign-up', element: <SignUp /> },
                { path: '/datasets', element: <p>Workspace</p> },
            ],
            { initialEntries: [path] }
        );
        routers.push(router);
        runtime.dependencies.session.setNavigator(next => {
            void router.navigate(next);
        });
        render(
            <StrictMode>
                <ClientRoot runtime={runtime} router={router} />
            </StrictMode>
        );
        fireEvent.change(screen.getByLabelText('Email Address'), {
            target: { value: 'a@b.com' },
        });
        fireEvent.change(screen.getByLabelText('Password'), {
            target: { value: 'password123' },
        });
        if (page === 'Sign up') {
            fireEvent.change(screen.getByLabelText('First Name'), {
                target: { value: 'A' },
            });
            fireEvent.change(screen.getByLabelText('Last Name'), {
                target: { value: 'B' },
            });
        }
        fireEvent.submit(screen.getByRole('form', { name: page }));
        await waitFor(() => expect(finish).toBeDefined());
        const destination = path === '/sign-in' ? '/sign-up' : '/sign-in';
        if (leave) {
            await act(async () => {
                await router.navigate(destination);
            });
        }
        const epoch = runtime.cache.epoch;
        await act(async () => {
            finish(
                endpoint === '/auth/register'
                    ? Response.json({ id: 'u' })
                    : new Response(null, { status: 204 })
            );
        });
        await waitFor(() =>
            expect(
                runtime.cache.queryClient.getMutationCache().getAll()[0]?.state.status
            ).toBe('success')
        );
        if (leave) {
            expect(requests).toEqual([`/api${endpoint}`]);
            expect(runtime.cache.epoch).toBe(epoch);
            expect(router.state.location.pathname).toBe(destination);
            expect(screen.queryByText('Workspace')).not.toBeInTheDocument();
        } else {
            await waitFor(() =>
                expect(screen.getByText('Workspace')).toBeInTheDocument()
            );
            expect(router.state.location.pathname).toBe('/datasets');
            expect(requests).toEqual(
                endpoint === '/auth/register'
                    ? ['/api/auth/register', '/api/auth/login', '/api/auth/me']
                    : ['/api/auth/login', '/api/auth/me']
            );
        }
    }
);
