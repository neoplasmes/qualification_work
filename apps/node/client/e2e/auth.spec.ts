import { randomUUID } from 'node:crypto';
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

type TestUser = {
    email: string;
    password: string;
    name: string;
    family: string;
};

const createUser = (): TestUser => ({
    email: `client-e2e-${randomUUID()}@example.com`,
    password: 'S3curePassword!',
    name: 'Client',
    family: 'Tester',
});

const registerByApi = async (request: APIRequestContext, user: TestUser) => {
    const response = await request.post('/api/auth/register', {
        data: user,
    });

    expect([201, 204]).toContain(response.status());
};

const signUpThroughUi = async (page: Page, user: TestUser) => {
    await page.goto('/sign-up');
    const form = page.getByRole('form', { name: 'Sign up' });

    await form.getByLabel('First Name').fill(user.name);
    await form.getByLabel('Last Name').fill(user.family);
    await form.getByLabel('Email Address').fill(user.email);
    await form.getByLabel('Password').fill(user.password);

    const registerRequest = page.waitForRequest(
        request =>
            request.url().includes('/api/auth/register') &&
            request.method() === 'POST'
    );
    const loginRequest = page.waitForRequest(
        request =>
            request.url().includes('/api/auth/login') && request.method() === 'POST'
    );

    await form.getByRole('button', { name: /sign up/i }).click();

    await registerRequest;
    await loginRequest;
    await expect(page).toHaveURL(/\/datasets$/, { timeout: 30_000 });
};

test.describe('auth through gateway', () => {
    test('registers a user, auto logs in, and opens datasets', async ({ page }) => {
        await signUpThroughUi(page, createUser());
    });

    test('creates and deletes a workspace, then logs out', async ({ page }) => {
        await signUpThroughUi(page, createUser());
        const workspaceName = `Secondary workspace ${randomUUID().slice(0, 8)}`;

        await page.getByRole('button', { name: 'Create workspace' }).click();
        const createWorkspaceForm = page.getByRole('form', {
            name: 'Create workspace',
        });
        await createWorkspaceForm
            .getByRole('textbox', { name: 'Workspace' })
            .fill(workspaceName);

        const createOrgResponse = page.waitForResponse(
            response =>
                response.url().includes('/api/orgs') &&
                response.request().method() === 'POST'
        );
        await createWorkspaceForm
            .getByRole('button', { name: 'Save workspace' })
            .click();
        expect((await createOrgResponse).status()).toBe(201);
        await expect(page.getByTestId('workspace-select')).toContainText(workspaceName);

        const deleteOrgResponse = page.waitForResponse(
            response =>
                response.url().includes('/api/orgs/') &&
                response.request().method() === 'DELETE'
        );
        await page.getByRole('button', { name: 'Delete workspace' }).click();
        await page.getByRole('button', { name: 'Confirm delete workspace' }).click();
        expect((await deleteOrgResponse).status()).toBe(204);

        const logoutResponse = page.waitForResponse(
            response =>
                response.url().includes('/api/auth/logout') &&
                response.request().method() === 'POST'
        );
        await page.getByRole('button', { name: 'Sign out' }).click();
        expect((await logoutResponse).status()).toBe(204);
        await expect(page).toHaveURL(/\/sign-in$/);
    });

    test('logs in an existing user', async ({ page, request }) => {
        const user = createUser();
        await registerByApi(request, user);

        await page.goto('/sign-in');
        const form = page.getByRole('form', { name: 'Sign in' });

        await form.getByLabel('Email Address').fill(user.email);
        await form.getByLabel('Password').fill(user.password);

        const loginRequest = page.waitForRequest(
            request =>
                request.url().includes('/api/auth/login') &&
                request.method() === 'POST'
        );

        await form.getByRole('button', { name: /sign in/i }).click();
        await loginRequest;
        await expect(page).toHaveURL(/\/datasets$/, { timeout: 30_000 });
    });

    test('shows an error for invalid login', async ({ page }) => {
        await page.goto('/sign-in');
        const form = page.getByRole('form', { name: 'Sign in' });

        await form
            .getByLabel('Email Address')
            .fill(`missing-${randomUUID()}@example.com`);
        await form.getByLabel('Password').fill('WrongPassword!');
        await form.getByRole('button', { name: /sign in/i }).click();

        await expect(page.getByRole('alert')).toBeVisible();
        await expect(page).toHaveURL(/\/sign-in$/);
    });
});
