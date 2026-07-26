/// <reference lib="dom" />
import path from 'node:path';
import { expect, test } from '@playwright/test';

import { registerAndLogin } from '../../backend/utils/auth.js';
import {
    createDashboard,
    fetchDatasetColumns,
    uploadCsvDataset,
} from '../../backend/utils/factories.js';

const screenshots = path.resolve(
    import.meta.dirname,
    '../../../.superpowers/sdd/2026-10-21-client-architecture-migration/task-13-browser-3/charts'
);

test('creates and edits all chart kinds with explicit previews and dashboard refresh', async ({
    page,
}) => {
    test.setTimeout(240_000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
        if (message.type() === 'error') {
            errors.push(message.text());
        }
    });
    const user = await registerAndLogin();
    const csv = 'category,segment,value\nA,North,10\nA,South,5\nB,North,20\nB,South,15\n';
    const dataset = await uploadCsvDataset(user, { csv, filename: 'chart-browser.csv' });
    const secondDataset = await uploadCsvDataset(user, {
        csv,
        filename: 'second-chart.csv',
    });
    const columns = await fetchDatasetColumns(user, dataset.id);
    const category = columns.find(column => column.key === 'category')!.id;
    const segment = columns.find(column => column.key === 'segment')!.id;
    const value = columns.find(column => column.key === 'value')!.id;
    const dashboard = await createDashboard(user, { name: 'Chart review' });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/sign-in');
    await page.getByLabel('Электронная почта').fill(user.email);
    await page.getByLabel('Пароль').fill(user.password);
    await page.getByRole('button', { name: 'Войти', exact: true }).click();
    await expect(page).toHaveURL(/\/datasets$/);
    const metadata = await (
        await page.request.get(`/api/data/datasets/${dataset.id}/metadata`)
    ).json();
    expect(
        metadata.columns.every((column: { isAnalyzable: boolean }) => column.isAnalyzable)
    ).toBe(true);
    await page.getByRole('link', { name: 'Графики', exact: true }).click();
    const created: { kind: string; id: string }[] = [];
    let previews = 0;
    page.on('request', request => {
        if (request.url().endsWith('/data/charts/preview')) {
            previews += 1;
        }
    });

    for (const kind of ['bar', 'line', 'pie', 'heatmap']) {
        await page.locator('[data-test-id="charts-create-chart-button"]').click();
        await page
            .getByRole('dialog', { name: 'Select dataset' })
            .getByRole('button', { name: /chart-browser/ })
            .click();
        const form = page.getByRole('form', { name: 'Add chart', exact: true });
        const previewCount = previews;
        await form.getByLabel('Chart name', { exact: true }).fill(`Browser ${kind}`);
        await form.getByRole('radio', { name: new RegExp(`^${kind}$`, 'i') }).click();
        await form
            .getByLabel(kind === 'pie' ? 'Slice by' : 'X axis', { exact: true })
            .selectOption(category);
        if (kind === 'heatmap') {
            await form.getByLabel('Y axis', { exact: true }).selectOption(segment);
        }
        await form.getByLabel('Aggregation', { exact: true }).selectOption('sum');
        await form.getByLabel('Column', { exact: true }).selectOption(value);
        expect(previews).toBe(previewCount);
        if (kind === 'bar') {
            await page.screenshot({
                path: path.join(screenshots, 'builder-desktop.png'),
                fullPage: true,
            });
        }
        const response = page.waitForResponse(
            response =>
                response.url().endsWith('/data/charts/preview') &&
                response.request().method() === 'POST'
        );
        await page.getByRole('button', { name: 'Preview', exact: true }).click();
        const result = await (await response).json();
        expect(result.kind).toBe(kind);
        expect(result.rows).toEqual(
            kind === 'heatmap'
                ? [
                      ['A', 'North', 10],
                      ['A', 'South', 5],
                      ['B', 'North', 20],
                      ['B', 'South', 15],
                  ]
                : kind === 'pie'
                  ? [
                        ['A', 15],
                        ['B', 35],
                        ['__other__', 0],
                    ]
                  : [
                        ['A', 15],
                        ['B', 35],
                    ]
        );
        const preview = page.locator('[aria-label="Chart preview"]');
        await expect(preview.getByTestId(`${kind}-chart-svg`)).toBeVisible();
        const renderer = preview.getByTestId(`${kind}-chart-svg`);
        await expect(
            kind === 'bar' || kind === 'line' ? renderer.locator('svg').first() : renderer
        ).toBeVisible();
        const bounds = await renderer.boundingBox();
        expect(bounds!.width).toBeGreaterThan(100);
        expect(bounds!.height).toBeGreaterThan(100);
        expect(
            await renderer
                .locator(kind === 'pie' || kind === 'line' ? 'path' : 'rect')
                .count()
        ).toBeGreaterThan(0);
        await preview.getByText('Exact values', { exact: true }).click();
        await expect(preview.getByRole('table')).toContainText(
            kind === 'heatmap' ? 'North' : '35'
        );
        await preview.getByText('Exact values', { exact: true }).click();
        await page.screenshot({
            path: path.join(screenshots, `${kind}-desktop.png`),
            fullPage: true,
        });
        await page.setViewportSize({ width: 390, height: 844 });
        await expect(preview.getByTestId(`${kind}-chart-svg`)).toBeVisible();
        expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
        ).toBe(true);
        await page.screenshot({
            path: path.join(screenshots, `${kind}-phone.png`),
            fullPage: true,
        });
        await page.setViewportSize({ width: 1440, height: 1000 });
        const creation = page.waitForResponse(
            response =>
                response.url().endsWith('/data/charts') &&
                response.request().method() === 'POST'
        );
        await page.getByRole('button', { name: 'Save chart', exact: true }).click();
        const { id } = await (await creation).json();
        created.push({ kind, id });
        await expect(page).toHaveURL(new RegExp(`/charts/view\\?id=${id}$`));
        await expect(
            page
                .locator('[aria-label="Saved chart result"]')
                .getByTestId(`${kind}-chart-svg`)
        ).toBeVisible();
        await page.getByRole('tab', { name: 'Edit', exact: true }).click();
        const edit = page.getByRole('form', { name: 'Edit chart', exact: true });
        if (kind === 'heatmap') {
            await edit.getByLabel('X axis', { exact: true }).selectOption(segment);
            await edit.getByLabel('Y axis', { exact: true }).selectOption(category);
        } else {
            await edit.getByLabel('Aggregation', { exact: true }).selectOption('avg');
        }
        if (kind === 'bar') {
            await page.getByRole('tab', { name: 'View', exact: true }).click();
            await page.getByRole('tab', { name: 'Edit', exact: true }).click();
            await expect(edit.getByLabel('Aggregation', { exact: true })).toHaveValue(
                'avg'
            );
            await page.getByRole('button', { name: 'Cancel edit', exact: true }).click();
            await page.getByRole('tab', { name: 'Edit', exact: true }).click();
            await expect(edit.getByLabel('Aggregation', { exact: true })).toHaveValue(
                'sum'
            );
            await edit.getByLabel('Aggregation', { exact: true }).selectOption('avg');
        }
        const update = page.waitForResponse(
            response =>
                response.url().endsWith(`/data/charts/${id}`) &&
                response.request().method() === 'PUT'
        );
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        expect((await update).status()).toBe(204);
        await page.getByRole('tab', { name: 'View', exact: true }).click();
        const saved = page.locator('[aria-label="Saved chart result"]');
        await expect(saved.getByTestId(`${kind}-chart-svg`)).toBeVisible();
        await saved.getByText('Exact values', { exact: true }).click();
        await expect(saved.getByRole('table')).toContainText(
            kind === 'heatmap' ? 'North' : '17.5'
        );
        expect(
            (
                await page.request.post(`/api/dashboards/${dashboard.id}/items`, {
                    data: { kind: 'chart', chartId: id },
                })
            ).ok()
        ).toBe(true);
        if (kind === 'bar') {
            await page.screenshot({
                path: path.join(screenshots, 'resize-return-desktop.png'),
                fullPage: true,
            });
        }
        await page.reload();
        await expect(
            page
                .locator('[aria-label="Saved chart result"]')
                .getByTestId(`${kind}-chart-svg`)
        ).toBeVisible();
    }

    await page.locator('[data-test-id="charts-create-chart-button"]').click();
    await page
        .getByRole('dialog')
        .getByRole('button', { name: /chart-browser/ })
        .click();
    await page.getByLabel('Chart name', { exact: true }).fill('Retained draft');
    await page.getByRole('radio', { name: 'Line', exact: true }).click();
    await page.getByRole('button', { name: 'Change dataset', exact: true }).click();
    await page
        .getByRole('dialog')
        .getByRole('button', { name: /second-chart/ })
        .click();
    await expect(page.getByLabel('Chart name', { exact: true })).toHaveValue(
        'Retained draft'
    );
    await expect(page.getByRole('radio', { name: 'Line', exact: true })).toBeChecked();
    expect(secondDataset.id).not.toBe(dataset.id);
    await page.getByRole('link', { name: 'Таблицы', exact: true }).click();
    await page.getByRole('link', { name: 'Графики', exact: true }).click();
    await expect(page.getByLabel('Chart name', { exact: true })).toHaveValue(
        'Retained draft'
    );
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
    ).toBe(true);
    await page.screenshot({
        path: path.join(screenshots, 'builder-phone.png'),
        fullPage: true,
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    let releaseOld = () => {};
    let receivedOld = () => {};
    const oldResponse = new Promise<void>(resolve => {
        receivedOld = resolve;
    });
    const gate = new Promise<void>(resolve => {
        releaseOld = resolve;
    });
    let gated = false;
    await page.route('**/api/data/charts/preview', async route => {
        if (gated) {
            await route.continue();

            return;
        }
        gated = true;
        const response = await route.fetch();
        receivedOld();
        await gate;
        await route.fulfill({ response });
    });
    try {
        await page.getByRole('button', { name: 'Preview', exact: true }).click();
        await oldResponse;
        await page.getByRole('radio', { name: 'Pie', exact: true }).click();
        const latest = page.waitForResponse(
            response =>
                response.url().endsWith('/data/charts/preview') &&
                response.request().postDataJSON().chartType === 'pie'
        );
        await page.getByRole('button', { name: 'Preview', exact: true }).click();
        expect((await (await latest).json()).kind).toBe('pie');
        await expect(
            page.locator('[aria-label="Chart preview"]').getByTestId('pie-chart-svg')
        ).toBeVisible();
        releaseOld();
        await page.unrouteAll({ behavior: 'wait' });
        await expect(
            page.locator('[aria-label="Chart preview"]').getByTestId('pie-chart-svg')
        ).toBeVisible();
        await expect(
            page.locator('[aria-label="Chart preview"]').getByTestId('line-chart-svg')
        ).toHaveCount(0);
    } finally {
        releaseOld();
        await page.unrouteAll({ behavior: 'wait' });
    }
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(page).toHaveURL(/\/charts$/);

    await page.getByRole('link', { name: 'Дашборды', exact: true }).click();
    await page.getByRole('button', { name: /Chart review/ }).click();
    await page.reload();
    for (const { kind } of created) {
        await expect(page.getByTestId(`${kind}-chart-svg`)).toBeVisible();
    }
    await page.screenshot({
        path: path.join(screenshots, 'dashboard-desktop.png'),
        fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
        path: path.join(screenshots, 'dashboard-phone.png'),
        fullPage: true,
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.getByRole('link', { name: 'Edit Browser bar', exact: true }).click();
    await page.locator('[data-test-id="charts-rename-button"]').click();
    await page.locator('[data-test-id="charts-rename-input"]').fill('Renamed bar');
    const rename = page.waitForResponse(
        response =>
            response.url().endsWith(`/data/charts/${created[0]!.id}`) &&
            response.request().method() === 'PATCH'
    );
    await page.locator('[data-test-id="charts-rename-input"]').press('Enter');
    expect((await rename).status()).toBe(204);
    await page.getByLabel('Aggregation', { exact: true }).selectOption('sum');
    const update = page.waitForResponse(
        response =>
            response.url().endsWith(`/data/charts/${created[0]!.id}`) &&
            response.request().method() === 'PUT'
    );
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    expect((await update).status()).toBe(204);
    await page.getByRole('link', { name: 'Дашборды', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboards(?:\/view)?(?:\?|$)/);
    const barCard = page
        .getByRole('article')
        .filter({ has: page.getByRole('heading', { name: 'Renamed bar', exact: true }) });
    await expect(barCard.getByTestId('bar-chart-svg')).toBeVisible();
    await barCard.getByText('Exact values', { exact: true }).click();
    await expect(barCard.getByRole('table')).toContainText('35');
    await expect(page).toHaveURL(/\/dashboards(?:\/view)?(?:\?|$)/);
    expect(errors).toEqual([]);
});
