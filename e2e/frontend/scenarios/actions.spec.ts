/// <reference lib="dom" />
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';

import { registerAndLogin } from '../../backend/utils/auth.js';
import { createBarChart, createDashboard } from '../../backend/utils/factories.js';
import { fillSetAmountAction } from './utils/index.js';

const screenshots = path.resolve(
    import.meta.dirname,
    `../../../apps/client/dist/migration-review/${new Date().toISOString().replaceAll(':', '-')}-actions`
);

test('runs a saved action and refreshes datasets charts dashboards and failure history', async ({
    page,
}) => {
    test.setTimeout(240_000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    const consoleErrors: { text: string; url: string }[] = [];
    const httpErrors: { url: string; method: string; status: number }[] = [];
    page.on('console', message => {
        if (message.type() === 'error') {
            consoleErrors.push({ text: message.text(), url: message.location().url });
        }
    });
    page.on('response', response => {
        if (response.status() >= 400) {
            httpErrors.push({
                url: response.url(),
                method: response.request().method(),
                status: response.status(),
            });
        }
    });
    try {
        const user = await registerAndLogin();
        const dashboard = await createDashboard(user, { name: 'Action review' });
        await page.setViewportSize({ width: 1440, height: 1000 });
        await page.goto('/sign-in');
        await page.getByLabel('Электронная почта').fill(user.email);
        await page.getByLabel('Пароль').fill(user.password);
        await page.getByRole('button', { name: 'Войти', exact: true }).click();
        await expect(page).toHaveURL(/\/datasets$/);
        await page.locator('[data-test-id="datasets-upload-button"]').click();
        await page.getByLabel('Файлы таблицы').setInputFiles({
            name: 'migration-values.csv',
            mimeType: 'text/csv',
            buffer: Buffer.from('sku,amount\nA,10\nB,20\nC,30\n'),
        });
        const uploaded = page.waitForResponse(
            response =>
                response.request().method() === 'POST' &&
                /\/data\/datasets\?/.test(response.url())
        );
        await page
            .getByRole('dialog')
            .getByRole('button', { name: 'Загрузить таблицу', exact: true })
            .click();
        const upload = await uploaded;
        expect(upload.status()).toBe(201);
        const { id: datasetId } = await upload.json();
        await expect(page.getByTestId('glide-cell-2-0')).toHaveText('10');
        const initialRows = await (
            await page.request.get(
                `/api/data/datasets/${datasetId}/rows?offset=0&limit=200`
            )
        ).json();
        const rowA = initialRows.rows.find(
            (row: { data: { sku: string } }) => row.data.sku === 'A'
        );
        const chart = await createBarChart(
            user,
            { id: datasetId, orgId: user.orgId },
            {
                name: 'Action amounts',
                dimensionKey: 'sku',
                measureKey: 'amount',
                aggregate: 'sum',
            }
        );
        expect(
            (
                await page.request.post(`/api/dashboards/${dashboard.id}/items`, {
                    data: { kind: 'chart', chartId: chart.id },
                })
            ).ok()
        ).toBe(true);
        expect(
            (
                await page.request.post(`/api/dashboards/${dashboard.id}/items`, {
                    data: {
                        kind: 'metric',
                        datasetId,
                        name: 'Migration total',
                        expression: 'sum(amount)',
                        format: '',
                        valueMultiplier: 1,
                    },
                })
            ).ok()
        ).toBe(true);
        await page.getByRole('link', { name: 'Графики', exact: true }).click();
        await page.getByRole('button', { name: /Action amounts/ }).click();
        const savedChart = page.locator('[aria-label="Сохранённый график"]');
        await savedChart.getByText('Точные значения', { exact: true }).click();
        await expect(
            savedChart
                .getByRole('row')
                .filter({ has: page.getByRole('cell', { name: 'A', exact: true }) })
        ).toContainText('10');
        await page.getByRole('link', { name: 'Дашборды', exact: true }).click();
        await page.getByRole('button', { name: /Action review/ }).click();
        const metric = page.locator(
            '[data-test-id="dashboards-metric-widget"][title="Migration total"]'
        );
        await expect(
            metric
                .locator('[data-test-id="dashboard-metric-value"]')
                .getByText(/^(60|75)$/, { exact: true })
        ).toHaveText('60');
        await page.getByRole('link', { name: 'Действия', exact: true }).click();
        await page.getByRole('button', { name: 'Новое действие', exact: true }).click();
        const form = await fillSetAmountAction(page, datasetId);
        await form
            .locator('[data-test-id="actions-action-name-input"]')
            .scrollIntoViewIfNeeded();
        await page.screenshot({
            path: path.join(screenshots, 'configure-desktop.png'),
            fullPage: true,
        });
        await page.setViewportSize({ width: 390, height: 844 });
        expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
        ).toBe(true);
        await page.screenshot({
            path: path.join(screenshots, 'configure-phone.png'),
            fullPage: true,
        });
        await page.setViewportSize({ width: 1440, height: 1000 });
        const created = page.waitForResponse(
            response =>
                response.url().endsWith('/data/actions') &&
                response.request().method() === 'POST'
        );
        await page.locator('[data-test-id="actions-save-button"]').click();
        const creation = await created;
        expect(creation.status()).toBe(201);
        const { id: actionId } = await creation.json();
        await expect(page).toHaveURL(new RegExp(`/actions/view\\?id=${actionId}$`));
        await page.locator('[data-test-id="actions-history-tab"]').click();
        const history = page.getByRole('region', { name: 'Журнал действий' });
        await expect(history.getByText('Выполнений пока нет.')).toBeVisible();
        let posts = 0;
        page.on('request', request => {
            if (
                request.method() === 'POST' &&
                request.url().endsWith(`/data/actions/${actionId}/runs`)
            ) {
                posts++;
            }
        });
        const run = page.waitForResponse(
            response =>
                response.url().endsWith(`/data/actions/${actionId}/runs`) &&
                response.request().method() === 'POST'
        );
        await page.getByLabel('New amount', { exact: true }).fill('25');
        await page.locator('[data-test-id="actions-run-button"]').click();
        const response = await run;
        expect(response.status()).toBe(201);
        expect(response.request().postDataJSON()).toEqual({
            parameters: { newAmount: 25 },
        });
        const result = await response.json();
        expect(result.status).toBe('success');
        expect(result.changes).toHaveLength(1);
        expect(result.changes[0].rowIds).toEqual([rowA.id]);
        expect(result.changes[0].before[0].data.amount).toBe(rowA.data.amount);
        expect(result.changes[0].after[0].data.amount).toBe(25);
        await expect(history.getByText('Выполнено', { exact: true })).toBeVisible();
        await page.screenshot({
            path: path.join(screenshots, 'run-desktop.png'),
            fullPage: true,
        });
        await page.setViewportSize({ width: 390, height: 844 });
        expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
        ).toBe(true);
        await page.screenshot({
            path: path.join(screenshots, 'run-phone.png'),
            fullPage: true,
        });
        await page.setViewportSize({ width: 1440, height: 1000 });
        await page.getByRole('link', { name: 'Дашборды', exact: true }).click();
        await expect(page).toHaveURL(/\/dashboards/);
        await expect(
            metric
                .locator('[data-test-id="dashboard-metric-value"]')
                .getByText(/^(60|75)$/, { exact: true })
        ).toHaveText('75');
        const chartCard = page.getByRole('article').filter({
            has: page.getByRole('heading', { name: 'Action amounts', exact: true }),
        });
        await chartCard.getByText('Точные значения', { exact: true }).click();
        await expect(
            chartCard
                .getByRole('row')
                .filter({ has: page.getByRole('cell', { name: 'A', exact: true }) })
        ).toContainText('25');
        await page.screenshot({
            path: path.join(screenshots, 'dashboard-refreshed.png'),
            fullPage: true,
        });
        await page.getByRole('link', { name: 'Графики', exact: true }).click();
        await expect(page).toHaveURL(/\/charts\/view/);
        await savedChart.getByText('Точные значения', { exact: true }).click();
        await expect(
            savedChart
                .getByRole('row')
                .filter({ has: page.getByRole('cell', { name: 'A', exact: true }) })
        ).toContainText('25');
        await page.getByRole('link', { name: 'Таблицы', exact: true }).click();
        await expect(page.getByTestId('glide-cell-2-0')).toHaveText('25');
        await expect(page.getByTestId('glide-cell-2-1')).toHaveText('20');
        await expect(page.getByTestId('glide-cell-2-2')).toHaveText('30');
        await page.screenshot({
            path: path.join(screenshots, 'dataset-refreshed.png'),
            fullPage: true,
        });
        await page.getByRole('link', { name: 'Действия', exact: true }).click();
        await page.locator('[data-test-id="actions-workspace-edit-tab"]').click();
        await form
            .locator('[data-test-id="actions-effect-card"]')
            .locator('[data-test-id="actions-effect-match-literal-input"]')
            .fill('__missing__');
        const update = page.waitForResponse(
            response =>
                response.url().endsWith(`/data/actions/${actionId}`) &&
                response.request().method() === 'PUT'
        );
        await page.locator('[data-test-id="actions-save-button"]').click();
        expect((await update).status()).toBe(204);
        await expect(page.locator('[data-test-id="actions-save-button"]')).toBeEnabled();
        await page.locator('[data-test-id="actions-workspace-view-tab"]').click();
        await page.getByLabel('New amount', { exact: true }).fill('25');
        const failed = page.waitForResponse(
            response =>
                response.url().endsWith(`/data/actions/${actionId}/runs`) &&
                response.request().method() === 'POST'
        );
        await page.locator('[data-test-id="actions-run-button"]').click();
        expect((await failed).status()).toBe(404);
        await expect(history.getByText('Ошибка', { exact: true })).toBeVisible();
        await expect(
            history.getByText('No rows matched action', { exact: true })
        ).toBeVisible();
        const runs = await (
            await page.request.get(
                `/api/data/actions/${actionId}/runs?orgId=${user.orgId}&offset=0&limit=50`
            )
        ).json();
        expect(runs).toHaveLength(2);
        expect(
            runs.filter((item: { status: string }) => item.status === 'failed')
        ).toHaveLength(1);
        await page.screenshot({
            path: path.join(screenshots, 'failed-history.png'),
            fullPage: true,
        });
        await page.route('**/api/data/actions/runs?*', async route => {
            await route.fulfill({
                status: 400,
                json: { error: 'History read unavailable' },
            });
        });
        await page.reload();
        await expect(history.getByRole('alert')).toContainText(
            'Не удалось загрузить журнал.'
        );
        await page.unroute('**/api/data/actions/runs?*');
        await history.getByRole('button', { name: 'Обновить журнал' }).click();
        await expect(history.getByText('Ошибка', { exact: true })).toBeVisible();
        expect(posts).toBe(2);
        await page.getByRole('link', { name: 'Таблицы', exact: true }).click();
        await expect(page.getByTestId('glide-cell-2-0')).toHaveText('25');
        await page.reload();
        await expect(page.getByTestId('glide-cell-2-0')).toHaveText('25');
        await page.getByRole('link', { name: 'Дашборды', exact: true }).click();
        await expect(
            metric
                .locator('[data-test-id="dashboard-metric-value"]')
                .getByText(/^(60|75)$/, { exact: true })
        ).toHaveText('75');
        expect(errors).toEqual([]);
        expect(
            consoleErrors.filter(
                error =>
                    !httpErrors.some(
                        response =>
                            response.url === error.url &&
                            ((response.method === 'POST' &&
                                response.status === 404 &&
                                response.url.endsWith(
                                    `/data/actions/${actionId}/runs`
                                )) ||
                                (response.method === 'GET' &&
                                    response.status === 400 &&
                                    response.url.includes('/data/actions/runs?')))
                    )
            )
        ).toEqual([]);
    } finally {
        await mkdir(screenshots, { recursive: true });
        await writeFile(
            path.join(screenshots, 'console-and-http-errors.json'),
            JSON.stringify({ pageErrors: errors, consoleErrors, httpErrors }, null, 2)
        );
    }
});
