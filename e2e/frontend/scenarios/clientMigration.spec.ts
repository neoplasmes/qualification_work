/// <reference lib="dom" />
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';

import { registerAndLogin } from '../../backend/utils/auth.js';
import {
    captureChartStates,
    captureResponsivePages,
    expectChartRows,
    fillMetricEditor,
    fillSetAmountAction,
} from './utils/index.js';

const screenshots = path.resolve(
    import.meta.dirname,
    `../../../apps/client/dist/migration-review/${new Date().toISOString().replaceAll(':', '-')}-clientMigration`
);

test('propagates a complete UI workflow across caches navigation and organizations', async ({
    page,
    request,
}) => {
    test.setTimeout(300_000);
    page.setDefaultTimeout(15_000);
    const consoleErrors: string[] = [];
    page.on('pageerror', error => consoleErrors.push(error.message));
    page.on('console', message => {
        if (message.type() === 'error') {
            consoleErrors.push(message.text());
        }
    });
    const user = await registerAndLogin();
    const me = await (
        await request.get('/api/auth/me', { headers: { cookie: user.cookie } })
    ).json();
    const organization = await request.post('/api/orgs', {
        headers: { cookie: user.cookie },
        data: {
            name: 'Empty migration workspace',
            displayName: 'Empty migration workspace',
            ownerId: me.id,
        },
    });
    expect(organization.status()).toBe(201);
    const { id: otherOrgId } = await organization.json();
    try {
        for (const route of ['sign-up', 'sign-in']) {
            await page.goto(`/${route}`);
            await captureResponsivePages({
                page,
                screenshots,
                name: route,
                widths: [1440, 390],
            });
        }
        await page.setViewportSize({ width: 1440, height: 1000 });
        await page.getByLabel('Электронная почта').fill(user.email);
        await page.getByLabel('Пароль').fill(user.password);
        await page.getByRole('button', { name: 'Войти', exact: true }).click();
        await expect(page).toHaveURL(/\/datasets$/);
        await page.getByTestId('workspace-select').selectOption(user.orgId);
        await page.getByRole('button', { name: 'Профиль', exact: true }).click();
        await expect(page.getByText(user.email, { exact: true })).toBeVisible();
        await captureResponsivePages({
            page,
            screenshots,
            name: 'profile',
            widths: [1440, 390],
        });
        await page.setViewportSize({ width: 1440, height: 1000 });
        await page.getByRole('link', { name: 'Таблицы', exact: true }).click();
        const uploadTrigger = page.locator('[data-test-id="datasets-upload-button"]');
        await uploadTrigger.click();
        let dialog = page.getByRole('dialog');
        await expect
            .poll(() =>
                dialog.evaluate(element => element.contains(document.activeElement))
            )
            .toBe(true);
        for (let step = 0; step < 12; step++) {
            await page.keyboard.press('Tab');
            expect(
                await dialog.evaluate(element => element.contains(document.activeElement))
            ).toBe(true);
        }
        await page.keyboard.press('Shift+Tab');
        expect(
            await dialog.evaluate(element => element.contains(document.activeElement))
        ).toBe(true);
        await page.keyboard.press('Escape');
        await expect(dialog).toBeHidden();
        await expect(uploadTrigger).toBeFocused();
        await uploadTrigger.click();
        await page.getByLabel('Файлы таблицы').setInputFiles({
            name: 'migration-values.csv',
            mimeType: 'text/csv',
            buffer: Buffer.from('sku,amount\nA,10\nB,20\nC,30\n'),
        });
        const uploadResponse = page.waitForResponse(
            response =>
                response.request().method() === 'POST' &&
                /\/data\/datasets\?/.test(response.url())
        );
        await page
            .getByRole('dialog')
            .getByRole('button', { name: 'Загрузить таблицу', exact: true })
            .click();
        const uploaded = await uploadResponse;
        expect(uploaded.status()).toBe(201);
        const { id: datasetId } = await uploaded.json();
        await expect(page.getByTestId('glide-cell-2-0')).toHaveText('10');
        const metadata = await (
            await page.request.get(`/api/data/datasets/${datasetId}/metadata`)
        ).json();
        const sku = metadata.columns.find(
            (column: { key: string }) => column.key === 'sku'
        ).id;
        const amount = metadata.columns.find(
            (column: { key: string }) => column.key === 'amount'
        ).id;
        const canvas = page.getByTestId('data-grid-canvas');
        await canvas.press('Escape');
        const bounds = await canvas.boundingBox();
        await page.mouse.click(bounds!.x + 56, bounds!.y + 57);
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Enter');
        const editor = page.locator('#portal textarea.gdg-input');
        await expect(editor).toBeVisible();
        await editor.fill('15');
        const patch = page.waitForResponse(
            response =>
                response.url().includes(`${datasetId}/rows`) &&
                response.request().method() === 'PATCH'
        );
        await editor.press('Enter');
        expect((await patch).ok()).toBe(true);
        await expect(page.getByTestId('glide-cell-2-0')).toHaveText('15');
        const rows = await (
            await page.request.get(
                `/api/data/datasets/${datasetId}/rows?offset=0&limit=200`
            )
        ).json();
        const rowA = rows.rows.find(
            (row: { data: { sku: string } }) => row.data.sku === 'A'
        );
        expect(Number(rowA.data.amount)).toBe(15);
        expect((await patch).request().postDataJSON()).toMatchObject({
            rowIds: [rowA.id],
            values: { amount: 15 },
        });

        await page.getByRole('link', { name: 'Графики', exact: true }).click();
        await page.locator('[data-test-id="charts-create-chart-button"]').click();
        await page
            .getByRole('dialog', { name: 'Выберите таблицу' })
            .getByRole('button', { name: /migration-values/ })
            .click();
        const chartForm = page.getByRole('form', { name: 'Новый график', exact: true });
        await chartForm
            .getByLabel('Название графика', { exact: true })
            .fill('Migration amounts');
        await chartForm.getByRole('radio', { name: 'Столбцы', exact: true }).click();
        await chartForm.getByLabel('Ось X', { exact: true }).selectOption(sku);
        await chartForm.getByLabel('Расчёт', { exact: true }).selectOption('sum');
        await chartForm.getByLabel('Поле', { exact: true }).selectOption(amount);
        await page.getByRole('button', { name: 'Предпросмотр', exact: true }).click();
        const preview = page.locator('[aria-label="Предпросмотр графика"]');
        await preview.getByText('Точные значения', { exact: true }).click();
        await expect(
            preview
                .getByRole('row')
                .filter({ has: page.getByRole('cell', { name: 'A', exact: true }) })
        ).toContainText('15');
        await page.getByRole('button', { name: 'Сохранить график', exact: true }).click();
        await expect(page).toHaveURL(/\/charts\/view\?id=/);
        const chartId = new URL(page.url()).searchParams.get('id')!;
        const chartUrl = page.url();
        const savedChart = page.locator('[aria-label="Сохранённый график"]');
        await savedChart.getByText('Точные значения', { exact: true }).click();
        await expect(savedChart.getByRole('table')).toContainText('15');

        await page.getByRole('link', { name: 'Дашборды', exact: true }).click();
        await page.locator('[data-test-id="dashboards-create-button"]').click();
        await expect(page).toHaveURL(/\/dashboards\?id=/);
        const dashboardId = new URL(page.url()).searchParams.get('id')!;
        const dashboardUrl = page.url();
        await page
            .locator('[data-test-id="dashboards-open-add-chart-modal-button"]')
            .click();
        await page
            .locator('[data-test-id="dashboards-add-chart-list-item"]')
            .filter({ hasText: 'Migration amounts' })
            .click();
        await page.locator('[data-test-id="dashboards-add-chart-button"]').click();
        await expect(
            page.locator('[data-test-id="dashboards-chart-widget"]')
        ).toHaveCount(1);
        dialog = await fillMetricEditor(page, {
            datasetId,
            name: 'Migration total',
            expression: 'sum(amount)',
            format: '',
            multiplier: '1',
            preview: '65',
        });
        await dialog.getByRole('button', { name: 'Сохранить', exact: true }).click();
        await expect(dialog).toBeHidden();
        const metricValue = page
            .locator(
                '[data-test-id="dashboards-metric-widget"][title="Migration total"] [data-test-id="dashboard-metric-value"]'
            )
            .getByText(/^(65|75)$/, { exact: true });
        await expect(metricValue).toHaveText('65');
        await page.getByRole('link', { name: 'Действия', exact: true }).click();
        await page.getByRole('button', { name: 'Новое действие', exact: true }).click();
        await fillSetAmountAction(page, datasetId);

        const createdAction = page.waitForResponse(
            response =>
                response.url().endsWith('/data/actions') &&
                response.request().method() === 'POST'
        );
        await page.locator('[data-test-id="actions-save-button"]').click();
        const creation = await createdAction;
        expect(creation.status()).toBe(201);
        const { id: actionId } = await creation.json();
        await expect(page).toHaveURL(new RegExp(`/actions/view\\?id=${actionId}$`));
        await page.locator('[data-test-id="actions-history-tab"]').click();
        await page.getByLabel('New amount', { exact: true }).fill('25');
        const executed = page.waitForResponse(
            response =>
                response.url().endsWith(`/data/actions/${actionId}/runs`) &&
                response.request().method() === 'POST'
        );
        await page.locator('[data-test-id="actions-run-button"]').click();
        const receipt = await executed;
        expect(receipt.status()).toBe(201);
        expect(receipt.request().postDataJSON()).toEqual({
            parameters: { newAmount: 25 },
        });
        const run = await receipt.json();
        expect(run.changes).toHaveLength(1);
        expect(run.changes[0].rowIds).toEqual([rowA.id]);
        expect(run.changes[0].before[0].data.amount).toBe(rowA.data.amount);
        expect(run.changes[0].after[0].data.amount).toBe(25);
        await expect(
            page
                .getByRole('region', { name: 'Журнал действий' })
                .getByText('Выполнено', { exact: true })
        ).toBeVisible();
        await page.getByRole('link', { name: 'Дашборды', exact: true }).click();
        await expect(metricValue).toHaveText('75');
        await page.getByRole('link', { name: 'Графики', exact: true }).click();
        await savedChart.getByText('Точные значения', { exact: true }).click();
        await expectChartRows(savedChart, [
            ['A', '25'],
            ['B', '20'],
            ['C', '30'],
        ]);
        await page.getByRole('link', { name: 'Таблицы', exact: true }).click();
        for (const [index, value] of ['25', '20', '30'].entries()) {
            await expect(page.getByTestId(`glide-cell-2-${index}`)).toHaveText(value);
        }
        await page.goBack();
        await expect(page).toHaveURL(chartUrl);
        await savedChart.getByText('Точные значения', { exact: true }).click();
        await expectChartRows(savedChart, [['A', '25']]);
        await page.goBack();
        await expect(page).toHaveURL(dashboardUrl);
        await expect(metricValue).toHaveText('75');
        await page.goForward();
        await expect(page).toHaveURL(chartUrl);
        await page.reload();
        await savedChart.getByText('Точные значения', { exact: true }).click();
        await expectChartRows(savedChart, [['A', '25']]);
        await page.getByRole('link', { name: 'Дашборды', exact: true }).click();
        await page.reload();
        await expect(metricValue).toHaveText('75');
        const card = page.locator('[data-test-id="dashboards-chart-widget"]');
        await captureChartStates({
            page,
            card,
            screenshots,
            record: 'chart-frames.json',
            name: 'completed-dashboard',
            widths: [1440, 390, 1440],
            values: ['25', '20', '30'],
            tableValue: '25',
            desktopCategories: ['A', 'C'],
        });
        await card.locator('summary').click();
        await page.getByRole('link', { name: 'Действия', exact: true }).click();
        await page.locator('[data-test-id="actions-history-tab"]').click();
        await page
            .getByRole('region', { name: 'Журнал действий' })
            .getByRole('button')
            .filter({ hasText: 'Выполнено' })
            .click();
        const history = await (
            await page.request.get(
                `/api/data/actions/${actionId}/runs?orgId=${user.orgId}&offset=0&limit=50`
            )
        ).json();
        expect(history[0].changes[0].before[0].data.amount).toBe(rowA.data.amount);
        await page.getByTestId('workspace-select').selectOption(otherOrgId);
        for (const [name, prefix] of [
            ['Таблицы', 'datasets'],
            ['Графики', 'charts'],
            ['Действия', 'actions'],
            ['Дашборды', 'dashboards'],
        ]) {
            await page.getByRole('link', { name, exact: true }).click();
            if (prefix === 'actions') {
                await expect(
                    page.getByText('Создайте действие для изменения данных.', {
                        exact: true,
                    })
                ).toBeVisible();
                await expect(
                    page.getByRole('button', { name: /Set amount/ })
                ).toHaveCount(0);
            } else {
                await expect(
                    page.locator(`[data-test-id="${prefix}-list-item"]`)
                ).toHaveCount(0);
            }
            await expect(page.getByText('Migration total', { exact: true })).toHaveCount(
                0
            );
        }
        await page.reload();
        await expect(page.getByTestId('workspace-select')).toHaveValue(otherOrgId);
        await expect(page.locator('[data-test-id="dashboards-list-item"]')).toHaveCount(
            0
        );
        await page.getByTestId('workspace-select').selectOption(user.orgId);
        await page.locator('[data-test-id="dashboards-list-item"]').click();
        await expect(page).toHaveURL(new RegExp(`/dashboards\\?id=${dashboardId}$`));
        await expect(metricValue).toHaveText('75');
        await page.getByRole('link', { name: 'Графики', exact: true }).click();
        await page.getByRole('button', { name: /Migration amounts/ }).click();
        await expect(page).toHaveURL(new RegExp(`/charts/view\\?id=${chartId}$`));
        await savedChart.getByText('Точные значения', { exact: true }).click();
        await expectChartRows(savedChart, [['A', '25']]);
        await page.getByRole('button', { name: 'Выйти', exact: true }).click();
        await expect(page).toHaveURL(/\/sign-in$/);
        expect(consoleErrors).toEqual([]);
    } finally {
        await mkdir(screenshots, { recursive: true });
        await writeFile(
            path.join(screenshots, 'console-errors.json'),
            JSON.stringify(consoleErrors, null, 2)
        );
    }
});
