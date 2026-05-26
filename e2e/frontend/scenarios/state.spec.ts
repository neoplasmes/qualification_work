import { randomUUID } from 'node:crypto';
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

type TestUser = {
    email: string;
    password: string;
    name: string;
    family: string;
};

const createUser = (): TestUser => ({
    email: `state-e2e-${randomUUID()}@example.com`,
    password: 'S3curePassword!',
    name: 'State',
    family: 'Tester',
});

const registerByApi = async (request: APIRequestContext, user: TestUser) => {
    const response = await request.post('/api/auth/register', {
        data: user,
    });

    expect([201, 204]).toContain(response.status());
};

const loginThroughUi = async (page: Page, user: TestUser) => {
    await page.goto('/sign-in');
    const form = page.getByRole('form', { name: 'Sign in' });

    await form.getByLabel('Email Address').fill(user.email);
    await form.getByLabel('Password').fill(user.password);

    await form.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/datasets$/, { timeout: 30_000 });
};

test.describe('auth guard state', () => {
    test('redirects unauthenticated user to sign-in', async ({ page }) => {
        await page.goto('/datasets');
        await expect(page).toHaveURL(/\/sign-in$/);
    });

    test('redirects to datasets when accessing sign-in while authenticated', async ({
        page,
        request,
    }) => {
        const user = createUser();
        await registerByApi(request, user);
        await loginThroughUi(page, user);

        await page.goto('/sign-in');
        await expect(page).toHaveURL(/\/datasets$/);
    });

    test('redirects to datasets when accessing sign-up while authenticated', async ({
        page,
        request,
    }) => {
        const user = createUser();
        await registerByApi(request, user);
        await loginThroughUi(page, user);

        await page.goto('/sign-up');
        await expect(page).toHaveURL(/\/datasets$/);
    });
});

test.describe('session state', () => {
    test('session cookie is set after login', async ({ page, request }) => {
        const user = createUser();
        await registerByApi(request, user);
        await loginThroughUi(page, user);

        const cookies = await page.context().cookies();
        const session = cookies.find(c => c.name === 'session');
        expect(session).toBeDefined();
        expect(session!.value).not.toBe('');
    });

    test('session persists after page reload', async ({ page, request }) => {
        const user = createUser();
        await registerByApi(request, user);
        await loginThroughUi(page, user);

        await page.reload();
        await expect(page).toHaveURL(/\/datasets$/);
    });

    test('session cookie is cleared after logout', async ({ page, request }) => {
        const user = createUser();
        await registerByApi(request, user);
        await loginThroughUi(page, user);

        const logoutResponse = page.waitForResponse(
            response =>
                response.url().includes('/api/auth/logout') &&
                response.request().method() === 'POST'
        );
        await page.getByRole('button', { name: 'Sign out' }).click();
        expect((await logoutResponse).status()).toBe(204);

        const cookies = await page.context().cookies();
        const session = cookies.find(c => c.name === 'session');
        // cookie must be absent or expired (empty value)
        expect(!session || session.value === '').toBe(true);
    });

    test('protected routes redirect after logout', async ({ page, request }) => {
        const user = createUser();
        await registerByApi(request, user);
        await loginThroughUi(page, user);

        await page.getByRole('button', { name: 'Sign out' }).click();
        await expect(page).toHaveURL(/\/sign-in$/);

        await page.goto('/datasets');
        await expect(page).toHaveURL(/\/sign-in$/);
    });
});

test.describe('navigation state', () => {
    test('all workspace routes are accessible after login', async ({ page, request }) => {
        const user = createUser();
        await registerByApi(request, user);
        await loginThroughUi(page, user);

        await page.goto('/charts');
        await expect(page).toHaveURL(/\/charts$/);

        await page.goto('/dashboards');
        await expect(page).toHaveURL(/\/dashboards$/);

        await page.goto('/actions');
        await expect(page).toHaveURL(/\/actions$/);
    });

    test('workspace select shows active org name', async ({ page, request }) => {
        const user = createUser();
        await registerByApi(request, user);
        await loginThroughUi(page, user);

        const workspaceSelect = page.getByTestId('workspace-select');
        await expect(workspaceSelect).toBeVisible();
        // org name includes the user first name since it's auto-created on registration
        const selected = await workspaceSelect.inputValue();
        expect(selected).not.toBe('');
    });
});
