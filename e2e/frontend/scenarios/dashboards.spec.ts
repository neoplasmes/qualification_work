/// <reference lib="dom" />
import path from 'node:path';
import { expect, test } from '@playwright/test';

import { registerAndLogin } from '../../backend/utils/auth.js';
import {
    createBarChart,
    fetchDatasetColumns,
    uploadCsvDataset,
} from '../../backend/utils/factories.js';

const screenshots = path.resolve(
    import.meta.dirname,
    '../../../.superpowers/sdd/2026-10-21-client-architecture-migration/task-13-browser-5/dashboards'
);

test('saves metric semantics and real dashboard gestures without phone layout writes', async ({
    page,
}) => {
    test.setTimeout(240_000);
    page.setDefaultTimeout(15_000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
        if (message.type() === 'error') {
            errors.push(message.text());
        }
    });
    const user = await registerAndLogin();
    const dataset = await uploadCsvDataset(user, {
        csv: 'created,category,value,orders\n2025-01-15,A,10,2\n2025-01-20,A,5,1\n2025-02-03,B,20,4\n2025-02-10,B,15,3\n',
        filename: 'dashboard-browser.csv',
    });
    const columns = await fetchDatasetColumns(user, dataset.id);
    expect(columns.find(column => column.key === 'created')?.dataType).toBe('date');
    const chart = await createBarChart(user, dataset, {
        name: 'Dashboard categories with a long readable title',
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/sign-in');
    await page.getByLabel('Электронная почта').fill(user.email);
    await page.getByLabel('Пароль').fill(user.password);
    await page.getByRole('button', { name: 'Войти', exact: true }).click();
    await expect(page).toHaveURL(/\/datasets$/);
    await page.getByRole('link', { name: 'Дашборды', exact: true }).click();
    await page.locator('[data-test-id="dashboards-create-button"]').click();
    await expect(page).toHaveURL(/\/dashboards\?id=/);
    const dashboardId = new URL(page.url()).searchParams.get('id')!;
    const endpoint = `/api/dashboards/${dashboardId}`;
    await page.locator('[data-test-id="dashboards-rename-button"]').click();
    await page
        .locator('[data-test-id="dashboards-rename-input"]')
        .fill('Показатели отдела');
    await page.locator('[data-test-id="dashboards-rename-input"]').press('Enter');
    await expect(
        page.getByRole('heading', { name: 'Показатели отдела' }).first()
    ).toBeVisible();

    for (const metric of [
        {
            name: 'Browser total',
            expression: 'sum(value)',
            format: '₽',
            multiplier: '1',
            target: '40',
            preview: '50 ₽',
        },
        {
            name: 'Browser ratio',
            expression: 'sum(value) / sum(orders)',
            format: '%',
            multiplier: '100',
            target: '6',
            preview: '500%',
        },
    ]) {
        await page
            .locator('[data-test-id="dashboards-open-add-metric-modal-button"]')
            .click();
        const dialog = page.getByRole('dialog', { name: 'Add metric', exact: true });
        await dialog
            .locator('[data-test-id="dashboards-metric-dataset-select"]')
            .selectOption(dataset.id);
        await dialog.getByRole('tab', { name: 'Formula', exact: true }).click();
        await dialog
            .locator('[data-test-id="dashboards-metric-expression-input"]')
            .fill(metric.expression);
        await dialog.getByLabel('Metric name', { exact: true }).fill(metric.name);
        await dialog.getByLabel('Format', { exact: true }).fill(metric.format);
        await dialog
            .locator('[data-test-id="dashboards-metric-value-multiplier-input"]')
            .fill(metric.multiplier);
        await dialog.getByRole('spinbutton', { name: /Target/ }).fill(metric.target);
        await expect(
            dialog.locator('[data-test-id="dashboards-metric-preview-value"]')
        ).toHaveText(metric.preview);
        const save = page.waitForResponse(
            response =>
                response.url().endsWith(`${dashboardId}/items`) &&
                response.request().method() === 'POST'
        );
        await dialog.getByRole('button', { name: 'Save', exact: true }).click();
        expect((await save).status()).toBe(201);
        await expect(dialog).not.toBeVisible();
    }
    await page.locator('[data-test-id="dashboards-open-add-chart-modal-button"]').click();
    await page
        .locator('[data-test-id="dashboards-add-chart-list-item"]')
        .filter({ hasText: 'Dashboard categories' })
        .click();
    await page.locator('[data-test-id="dashboards-add-chart-button"]').click();
    await expect(page.locator('[data-test-id="dashboards-chart-widget"]')).toHaveCount(1);
    const detail = await (await page.request.get(endpoint)).json();
    const total = detail.items.find(
        (item: { name?: string }) => item.name === 'Browser total'
    );
    const ratio = detail.items.find(
        (item: { name?: string }) => item.name === 'Browser ratio'
    );
    const chartItem = detail.items.find(
        (item: { kind: string }) => item.kind === 'chart'
    );
    expect(total).toMatchObject({
        value: 50,
        targetDirection: 'higher',
        layout: { width: 3, height: 4 },
    });
    expect(ratio).toMatchObject({ value: 5, valueMultiplier: 100 });
    expect(chartItem.chartId).toBe(chart.id);
    const initialLayout = [
        { itemId: total.id, posX: 0, posY: 0, width: 3, height: 4 },
        { itemId: ratio.id, posX: 3, posY: 0, width: 3, height: 2 },
        { itemId: chartItem.id, posX: 0, posY: 4, width: 6, height: 6 },
    ];
    expect(
        (
            await page.request.patch(`${endpoint}/items/layout`, {
                data: { layout: initialLayout },
            })
        ).status()
    ).toBe(204);
    await page.reload();
    const totalCard = page.locator(
        '[data-test-id="dashboards-metric-widget"][title="Browser total"]'
    );
    await expect(totalCard).toContainText('50 ₽');
    await expect(totalCard).toContainText('+25%');
    await expect(
        page.locator('[title="Browser ratio"][data-test-id="dashboards-metric-widget"]')
    ).toContainText('500%');
    const compact = page.locator(
        '[title="Browser ratio"][data-test-id="dashboards-metric-widget"]'
    );
    await compact.focus();
    await compact.press('End');
    await expect
        .poll(() => compact.evaluate(element => element.scrollTop))
        .toBeGreaterThan(0);
    const target = compact.locator('[title="Target"]');
    const meterBounds = await compact.getByRole('meter').boundingBox();
    const targetBounds = await target.boundingBox();
    expect(meterBounds!.x + meterBounds!.width).toBeLessThanOrEqual(targetBounds!.x);
    expect(
        await target.evaluate(element => element.scrollWidth <= element.clientWidth)
    ).toBe(true);
    await compact.screenshot({
        path: path.join(screenshots, 'existing-two-row-goal.png'),
    });
    const primaryValue = compact
        .locator('[data-test-id="dashboard-metric-value"]')
        .getByText('500%', { exact: true });
    await primaryValue.scrollIntoViewIfNeeded();
    const compactBounds = await compact.boundingBox();
    const primaryBounds = await primaryValue.boundingBox();
    expect(primaryBounds!.y).toBeGreaterThanOrEqual(compactBounds!.y);
    expect(primaryBounds!.y + primaryBounds!.height).toBeLessThanOrEqual(
        compactBounds!.y + compactBounds!.height
    );
    await compact.screenshot({
        path: path.join(screenshots, 'existing-two-row-value.png'),
    });
    await compact.focus();
    await compact.press('Home');
    for (const name of ['Edit Browser ratio', 'Remove Browser ratio']) {
        const control = compact.getByRole('button', { name, exact: true });
        await control.focus();
        await expect(control).toBeFocused();
        const box = await control.boundingBox();
        expect(box!.x).toBeGreaterThanOrEqual(compactBounds!.x);
        expect(box!.x + box!.width).toBeLessThanOrEqual(
            compactBounds!.x + compactBounds!.width
        );
    }
    await compact.screenshot({
        path: path.join(screenshots, 'existing-two-row-controls.png'),
    });
    await expect(page.getByTestId('bar-chart-svg').locator('svg').first()).toBeVisible();
    await page.screenshot({
        path: path.join(screenshots, 'dashboard-desktop.png'),
        fullPage: true,
    });

    const layoutButton = page.getByRole('button', { name: 'Расположение', exact: true });
    await layoutButton.focus();
    await layoutButton.press('Enter');
    const layoutDialog = page.getByRole('dialog', { name: 'Расположение виджетов' });
    await layoutDialog.getByLabel('Высота', { exact: true }).first().fill('3');
    const keyboardSave = page.waitForResponse(
        response =>
            response.url().endsWith(`${dashboardId}/items/layout`) &&
            response.request().method() === 'PATCH'
    );
    await layoutDialog.getByRole('button', { name: 'Сохранить расположение' }).focus();
    await page.keyboard.press('Enter');
    expect((await keyboardSave).status()).toBe(204);
    await expect(layoutDialog).not.toBeVisible();

    const requests: Array<{
        layout: Array<{
            itemId: string;
            posX: number;
            posY: number;
            width: number;
            height: number;
        }>;
    }> = [];
    page.on('request', request => {
        if (
            request.url().endsWith(`${dashboardId}/items/layout`) &&
            request.method() === 'PATCH'
        ) {
            requests.push(request.postDataJSON());
        }
    });
    const cell = page.locator(`.grid-stack-item[gs-id="${total.id}"]`);
    const grid = page.locator('.grid-stack');
    await totalCard.scrollIntoViewIfNeeded();
    const heading = await totalCard
        .getByRole('heading', { name: 'Browser total' })
        .boundingBox();
    const bounds = await grid.boundingBox();
    expect(heading).not.toBeNull();
    expect(bounds).not.toBeNull();
    const dragResponse = page.waitForResponse(
        response =>
            response.url().endsWith(`${dashboardId}/items/layout`) &&
            response.request().method() === 'PATCH'
    );
    await page.mouse.move(heading!.x + 12, heading!.y + 10);
    await page.mouse.down();
    await page.mouse.move(heading!.x + 20, heading!.y + 12, { steps: 4 });
    await page.mouse.move(heading!.x + 12 + bounds!.width / 2, heading!.y + 10, {
        steps: 20,
    });
    await page.mouse.up();
    expect((await dragResponse).status()).toBe(204);
    await expect(cell).not.toHaveAttribute('gs-x', '0');
    expect(requests.at(-1)!.layout).toHaveLength(3);
    const movedX = Number(await cell.getAttribute('gs-x'));
    const resize = cell.locator('.ui-resizable-se');
    await cell.hover();
    const handle = await resize.boundingBox();
    const resizeResponse = page.waitForResponse(
        response =>
            response.url().endsWith(`${dashboardId}/items/layout`) &&
            response.request().method() === 'PATCH'
    );
    await page.mouse.move(handle!.x + handle!.width / 2, handle!.y + handle!.height / 2);
    await page.mouse.down();
    await page.mouse.move(
        handle!.x + bounds!.width / 12 + handle!.width / 2,
        handle!.y + 64 + handle!.height / 2,
        { steps: 20 }
    );
    await page.mouse.up();
    expect((await resizeResponse).status()).toBe(204);
    await expect(cell).toHaveAttribute('gs-w', '4');
    const savedLayout = requests.at(-1)!.layout;
    await page.reload();
    await expect(cell).toHaveAttribute('gs-x', String(movedX));
    await expect(cell).toHaveAttribute('gs-w', '4');
    const beforePhone = requests.length;
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(grid).toHaveClass(/(?:^|\s)gs-1(?:\s|$)/);
    for (const widget of await page.locator('.grid-stack-item').all()) {
        await expect
            .poll(async () => Number((await widget.getAttribute('gs-w')) ?? 1))
            .toBe(1);
        await expect
            .poll(async () => Number((await widget.getAttribute('gs-x')) ?? 0))
            .toBe(0);
    }
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth
        )
    ).toBe(true);
    await page.screenshot({
        path: path.join(screenshots, 'dashboard-phone.png'),
        fullPage: true,
    });
    await totalCard.screenshot({ path: path.join(screenshots, 'metric-phone.png') });
    expect(requests).toHaveLength(beforePhone);
    const afterPhone = await (await page.request.get(endpoint)).json();
    expect(
        afterPhone.items
            .map((item: { id: string; layout: unknown }) => ({
                itemId: item.id,
                ...(item.layout as object),
            }))
            .sort((a: { itemId: string }, b: { itemId: string }) =>
                a.itemId.localeCompare(b.itemId)
            )
    ).toEqual([...savedLayout].sort((a, b) => a.itemId.localeCompare(b.itemId)));
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.reload();
    await expect(cell).toHaveAttribute('gs-w', '4');

    await totalCard
        .getByRole('button', { name: 'Edit Browser total', exact: true })
        .click();
    const edit = page.getByRole('dialog', { name: 'Edit metric', exact: true });
    await edit.getByRole('tab', { name: 'Lower is better', exact: true }).click();
    await edit.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(edit).not.toBeVisible();
    await expect(totalCard.getByRole('meter')).toHaveAttribute('aria-valuenow', '80');
    await totalCard.screenshot({ path: path.join(screenshots, 'metric-adverse.png') });

    for (const metric of [
        {
            name: 'Browser monthly',
            expression: 'sum(value)',
            expected: 50,
            preview: '50',
            trend: true,
        },
        {
            name: 'Browser null',
            expression: 'sum(value) / 0',
            expected: null,
            preview: 'No value',
            trend: false,
        },
        {
            name: 'Browser zero',
            expression: 'sum(value) - sum(value)',
            expected: 0,
            preview: '0',
            trend: false,
        },
    ]) {
        await page
            .locator('[data-test-id="dashboards-open-add-metric-modal-button"]')
            .click();
        const dialog = page.getByRole('dialog', { name: 'Add metric', exact: true });
        await dialog.getByRole('tab', { name: 'Formula', exact: true }).click();
        await dialog
            .locator('[data-test-id="dashboards-metric-expression-input"]')
            .fill(metric.expression);
        await dialog.getByLabel('Metric name', { exact: true }).fill(metric.name);
        if (metric.name === 'Browser zero') {
            await dialog.getByRole('spinbutton', { name: /Target/ }).fill('0');
        }
        if (metric.trend) {
            const trend = dialog.getByRole('switch', { name: 'Trend', exact: true });
            await trend.locator('..').click();
            await expect(trend).toBeChecked();
            await dialog
                .getByLabel('Time column', { exact: true })
                .selectOption('created');
            await dialog.getByLabel('Bucket', { exact: true }).selectOption('month');
        }
        await expect(
            dialog.locator('[data-test-id="dashboards-metric-preview-value"]')
        ).toHaveText(metric.preview);
        await dialog.getByRole('button', { name: 'Save', exact: true }).click();
        await expect(dialog).not.toBeVisible();
        const saved = await (await page.request.get(endpoint)).json();
        const item = saved.items.find(
            (item: { name?: string }) => item.name === metric.name
        );
        expect(item.value).toBe(metric.expected);
        if (metric.trend) {
            expect(item.trend.map((point: { value: number }) => point.value)).toEqual([
                15, 35,
            ]);
        }
        const card = page.locator(
            `[data-test-id="dashboards-metric-widget"][title="${metric.name}"]`
        );
        await expect(card).toContainText(
            metric.expected === null ? 'Нет данных' : String(metric.expected)
        );
        if (metric.trend) {
            const sparkline = card
                .locator('svg')
                .filter({ has: page.locator('path[fill="none"]') });
            await expect(sparkline).toHaveCount(1);
            await expect(sparkline.locator('path')).toHaveAttribute('d', /.+/);
            await sparkline.scrollIntoViewIfNeeded();
        }
        if (metric.name === 'Browser zero') {
            await expect(card.getByRole('meter')).toHaveAttribute('aria-valuenow', '100');
        }
        await card.screenshot({
            path: path.join(screenshots, `${metric.name.replaceAll(' ', '-')}.png`),
        });
    }
    await page
        .locator('[data-test-id="dashboards-metric-widget"][title="Browser null"]')
        .getByRole('button', { name: 'Remove Browser null', exact: true })
        .click();
    await expect(
        page.locator('[data-test-id="dashboards-metric-widget"][title="Browser null"]')
    ).toHaveCount(0);
    await page.locator('[data-test-id="dashboards-delete-button"]').click();
    await page.getByRole('button', { name: 'Подтвердить удаление', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboards$/);
    await expect(page.getByRole('button', { name: /Показатели отдела/ })).toHaveCount(0);
    expect(errors).toEqual([]);
});
