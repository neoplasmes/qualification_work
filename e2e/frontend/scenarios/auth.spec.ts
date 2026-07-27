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
    const form = page.getByRole('form', { name: 'Регистрация' });

    await form.getByLabel('Имя').fill(user.name);
    await form.getByLabel('Фамилия').fill(user.family);
    await form.getByLabel('Электронная почта').fill(user.email);
    await form.getByLabel('Пароль').fill(user.password);

    const registerRequest = page.waitForRequest(
        request =>
            request.url().includes('/api/auth/register') && request.method() === 'POST'
    );
    const loginRequest = page.waitForRequest(
        request =>
            request.url().includes('/api/auth/login') && request.method() === 'POST'
    );

    await form.getByRole('button', { name: /Зарегистрироваться/i }).click();

    await registerRequest;
    await loginRequest;
    await expect(page).toHaveURL(/\/datasets$/, { timeout: 30_000 });
};

test.describe('auth through gateway', () => {
    test('registers a user, auto logs in, and opens datasets', async ({ page }) => {
        await signUpThroughUi(page, createUser());
    });

    test('logs in an existing user', async ({ page, request }) => {
        const user = createUser();
        await registerByApi(request, user);

        await page.goto('/sign-in');
        const form = page.getByRole('form', { name: 'Вход' });

        await form.getByLabel('Электронная почта').fill(user.email);
        await form.getByLabel('Пароль').fill(user.password);

        const loginRequest = page.waitForRequest(
            request =>
                request.url().includes('/api/auth/login') && request.method() === 'POST'
        );

        await form.getByRole('button', { name: /Войти/i }).click();
        await loginRequest;
        await expect(page).toHaveURL(/\/datasets$/, { timeout: 30_000 });
    });

    test('shows an error for invalid login', async ({ page }) => {
        await page.goto('/sign-in');
        const form = page.getByRole('form', { name: 'Вход' });

        await form
            .getByLabel('Электронная почта')
            .fill(`missing-${randomUUID()}@example.com`);
        await form.getByLabel('Пароль').fill('WrongPassword!');
        await form.getByRole('button', { name: /Войти/i }).click();

        await expect(page.getByRole('alert')).toBeVisible();
        await expect(page).toHaveURL(/\/sign-in$/);
    });
});

test('failed logout still clears authenticated browser state', async ({ page }) => {
    await signUpThroughUi(page, createUser());
    await page.evaluate(() => {
        localStorage.setItem(
            'chartsPage_v1',
            JSON.stringify({ privateSelection: 'old' })
        );
        localStorage.setItem('panelLayout_v2', JSON.stringify({ sizes: {} }));
    });
    await page.route('**/api/auth/logout', route => route.abort());
    await page.getByRole('button', { name: 'Выйти' }).click();
    await expect(page).toHaveURL(/\/sign-in$/);
    expect(await page.evaluate(() => localStorage.getItem('chartsPage_v1'))).toBeNull();
    expect(
        await page.evaluate(() =>
            localStorage.getItem('qualification-work.active-org-id')
        )
    ).toBeNull();
    expect(
        await page.evaluate(() => localStorage.getItem('panelLayout_v2'))
    ).not.toBeNull();
});
