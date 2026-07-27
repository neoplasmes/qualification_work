import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';

const visual = expect.configure({ soft: true, timeout: 1000 });

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    test(`paper control states with motion preference ${reducedMotion}`, async ({
        page,
        request,
    }, testInfo) => {
        await page.emulateMedia({ reducedMotion });
        const user = {
            email: `controls-${randomUUID()}@example.com`,
            password: 'S3curePassword!',
            name: 'Controls',
            family: 'Tester',
        };
        const response = await request.post('/api/auth/register', { data: user });
        expect([201, 204]).toContain(response.status());
        await page.goto('/sign-in');
        const form = page.getByRole('form', { name: 'Вход' });
        await form.getByLabel('Электронная почта').fill(user.email);
        await form.getByLabel('Пароль').fill(user.password);
        await form.getByRole('button', { name: 'Войти', exact: true }).click();
        await expect(page).toHaveURL(/\/datasets$/, { timeout: 30_000 });
        await page.getByRole('link', { name: 'Дашборды', exact: true }).click();
        await page.locator('[data-test-id="dashboards-create-button"]').click();
        await expect(page).toHaveURL(/\/dashboards\?id=/);
        const row = page
            .locator('[data-test-id="dashboards-list-item"]')
            .filter({ hasText: 'Новый дашборд' });
        await expect(row).toBeVisible();
        await visual(row).toHaveCSS('background-color', 'rgb(26, 22, 20)');
        await visual(row.getByText('Новый дашборд', { exact: true })).toHaveCSS(
            'color',
            'rgb(244, 244, 231)'
        );
        await visual(row.locator('svg')).toHaveCSS('color', 'rgb(244, 244, 231)');
        await visual(row.locator(':scope > div > div').nth(1)).toHaveCSS(
            'color',
            'rgb(244, 244, 231)'
        );
        await row.screenshot({ path: testInfo.outputPath('selected-row.png') });
        await page
            .locator('[data-test-id="dashboards-open-add-metric-modal-button"]')
            .click();
        const dialog = page.getByRole('dialog', {
            name: 'Добавить метрику',
            exact: true,
        });
        const toggle = dialog.getByRole('switch', { name: 'Динамика', exact: true });
        const switchRoot = toggle.locator('..');
        const track = switchRoot.locator(':scope > span');
        const thumb = track.locator(':scope > span');
        await expect(toggle).not.toBeChecked();
        await visual(track).toHaveCSS('background-color', 'rgb(247, 246, 243)');
        await visual(thumb).toHaveCSS('background-color', 'rgb(26, 22, 20)');
        await switchRoot.click();
        await expect(toggle).toBeChecked();
        await visual(track).toHaveCSS('background-color', 'rgb(26, 22, 20)');
        await visual(thumb).toHaveCSS('background-color', 'rgb(244, 244, 231)');
        await dialog.getByRole('spinbutton', { name: 'Цель', exact: true }).fill('100');
        const tabs = dialog.getByRole('tablist', {
            name: 'Направление цели',
            exact: true,
        });
        const inactive = tabs.getByRole('tab', { name: 'Меньше — лучше', exact: true });
        await inactive.hover();
        await visual(inactive).toHaveAttribute('aria-selected', 'false');
        await visual(inactive).toHaveCSS('color', 'rgb(26, 22, 20)');
        await page.mouse.move(0, 0);
        await tabs.getByRole('tab', { name: 'Больше — лучше', exact: true }).focus();
        await page.keyboard.press('Tab');
        await expect(inactive).toBeFocused();
        await visual(inactive).toHaveCSS('color', 'rgb(26, 22, 20)');
        await visual(inactive).toHaveCSS('outline-style', 'solid');
        await visual(inactive).toHaveCSS('outline-color', 'rgb(26, 22, 20)');
        await dialog.screenshot({
            path: testInfo.outputPath('inactive-focus-checked-switch.png'),
        });
        if (reducedMotion === 'reduce') {
            expect(
                await page.evaluate<boolean>(
                    'matchMedia("(prefers-reduced-motion: reduce)").matches'
                )
            ).toBe(true);
            await visual(thumb).toHaveCSS('transition-duration', '0s');
            const motion = await page.evaluate<{
                x: number;
                width: number;
            }>(`(async () => {
                const group = document.querySelector('[role="tablist"][aria-label="Направление цели"]');
                const indicator = group.querySelector('[aria-hidden="true"]');
                group.querySelector('button[aria-selected="false"]').click();
                await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
                return {x:new DOMMatrixReadOnly(getComputedStyle(indicator).transform).m41,width:indicator.getBoundingClientRect().width};
            })()`);
            visual(Math.abs(motion.x - motion.width)).toBeLessThan(1);
        } else {
            await inactive.click();
        }
        await expect(inactive).toHaveAttribute('aria-selected', 'true');
        await visual(inactive).toHaveCSS('color', 'rgb(244, 244, 231)');
        await switchRoot.click();
        await expect(toggle).not.toBeChecked();
        await visual(thumb).toHaveCSS('background-color', 'rgb(26, 22, 20)');
    });
}
