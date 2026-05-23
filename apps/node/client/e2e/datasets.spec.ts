import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';

import { createCsvFixture, createXlsxFixture } from './fixtures';

type TestUser = {
    email: string;
    password: string;
    name: string;
    family: string;
};

const createUser = (): TestUser => ({
    email: `dataset-e2e-${randomUUID()}@example.com`,
    password: 'S3curePassword!',
    name: 'Dataset',
    family: 'Tester',
});

const signUpThroughUi = async (page: Page, user: TestUser) => {
    await page.goto('/sign-up');
    const form = page.getByRole('form', { name: 'Sign up' });

    await form.getByLabel('First Name').fill(user.name);
    await form.getByLabel('Last Name').fill(user.family);
    await form.getByLabel('Email Address').fill(user.email);
    await form.getByLabel('Password').fill(user.password);
    await form.getByRole('button', { name: /sign up/i }).click();
    await expect(page).toHaveURL(/\/datasets$/, { timeout: 30_000 });
};

const uploadFixture = async (
    page: Page,
    file: { name: string; mimeType: string; buffer: Buffer },
    expected: {
        datasetName: string;
        sourceType: string;
        rows: number;
        columns: number;
        cell: string;
    }
) => {
    await page.getByLabel('Dataset file').setInputFiles(file);

    const uploadRequest = page.waitForRequest(
        request =>
            request.url().includes('/api/data/datasets?orgId=') &&
            request.method() === 'POST'
    );
    const uploadResponse = page.waitForResponse(
        response =>
            response.url().includes('/api/data/datasets?orgId=') &&
            response.request().method() === 'POST'
    );

    await page.getByRole('button', { name: /upload dataset/i }).click();

    const request = await uploadRequest;
    expect(request.url()).toContain('/api/data/datasets?orgId=');
    expect((await uploadResponse).status()).toBe(201);

    await expect(
        page.getByRole('button', { name: new RegExp(expected.datasetName) })
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('heading', { name: expected.datasetName })).toBeVisible();
    await expect(page.getByText(`${expected.rows} rows`)).toBeVisible();
    await expect(page.getByText(`${expected.columns} columns`)).toBeVisible();
    await expect(
        page.getByLabel('Dataset details').getByText(expected.sourceType, { exact: true })
    ).toBeVisible();
    await expect(page.getByText(expected.cell, { exact: true })).toBeVisible({
        timeout: 30_000,
    });
};

test.describe('dataset upload through gateway', () => {
    test('uploads CSV and XLSX datasets and renders previews', async ({ page }) => {
        await signUpThroughUi(page, createUser());

        await uploadFixture(
            page,
            {
                name: 'wide-sales.csv',
                mimeType: 'text/csv',
                buffer: Buffer.from(createCsvFixture()),
            },
            {
                datasetName: 'wide-sales',
                sourceType: 'csv',
                rows: 180,
                columns: 16,
                cell: 'North-001',
            }
        );

        const chartBuilder = page.getByLabel('Chart builder');
        await chartBuilder.getByLabel('Name').fill('Sales by category');
        await chartBuilder.getByLabel('Dimension').selectOption({ label: 'category' });

        const createChartResponse = page.waitForResponse(
            response =>
                response.url().includes('/api/data/charts') &&
                response.request().method() === 'POST'
        );
        const chartDataResponse = page.waitForResponse(
            response =>
                response.url().includes('/api/data/charts/') &&
                response.url().includes('/data')
        );

        await chartBuilder.getByRole('button', { name: /build chart/i }).click();
        expect((await createChartResponse).status()).toBe(201);
        expect((await chartDataResponse).status()).toBe(200);
        const chartResult = page.getByLabel('Chart result');
        await expect(chartResult).toBeVisible();
        await expect(chartResult.getByTestId('bar-chart-svg')).toBeVisible();
        await expect(
            chartResult.getByTestId('bar-chart-svg').locator('rect')
        ).toHaveCount(3);
        await expect(page.getByText('Chart ID:')).toBeVisible();
        await expect(chartResult.getByRole('cell', { name: 'Hardware' })).toBeVisible();
        await expect(chartResult.getByRole('cell', { name: '60' })).toHaveCount(3);

        await chartBuilder.getByLabel('Name').fill('Sales pie');
        await chartBuilder.getByLabel('Type').selectOption('pie');
        await chartBuilder.getByLabel('Top slices').fill('4');

        const createPieResponse = page.waitForResponse(
            response =>
                response.url().includes('/api/data/charts') &&
                response.request().method() === 'POST'
        );
        const pieDataResponse = page.waitForResponse(
            response =>
                response.url().includes('/api/data/charts/') &&
                response.url().includes('/data')
        );

        await chartBuilder.getByRole('button', { name: /build chart/i }).click();
        expect((await createPieResponse).status()).toBe(201);
        expect((await pieDataResponse).status()).toBe(200);
        await expect(chartResult.getByTestId('pie-chart-svg')).toBeVisible();
        await expect(
            chartResult.getByTestId('pie-chart-svg').locator('path')
        ).toHaveCount(3);

        await chartBuilder.getByLabel('Name').fill('Sales heatmap');
        await chartBuilder.getByLabel('Type').selectOption('heatmap');
        await chartBuilder.getByLabel('X dimension').selectOption({ label: 'category' });
        await chartBuilder.getByLabel('Y dimension').selectOption({ label: 'segment' });
        await chartBuilder.getByLabel('Aggregate').selectOption('avg');
        await chartBuilder
            .getByTestId('primary-measure-select')
            .selectOption({ label: 'sales' });

        const createHeatmapResponse = page.waitForResponse(
            response =>
                response.url().includes('/api/data/charts') &&
                response.request().method() === 'POST'
        );
        const heatmapDataResponse = page.waitForResponse(
            response =>
                response.url().includes('/api/data/charts/') &&
                response.url().includes('/data')
        );

        await chartBuilder.getByRole('button', { name: /build chart/i }).click();
        expect((await createHeatmapResponse).status()).toBe(201);
        expect((await heatmapDataResponse).status()).toBe(200);
        await expect(chartResult.getByTestId('heatmap-chart-svg')).toBeVisible();
        await expect(
            chartResult.getByRole('cell', { name: 'Enterprise' }).first()
        ).toBeVisible();

        await page.getByRole('link', { name: /open saved charts/i }).click();
        await expect(page).toHaveURL(/\/charts$/);
        await expect(page.getByRole('heading', { name: 'Charts' })).toBeVisible();
        await expect(
            page.getByRole('button', { name: /Sales by category/ })
        ).toBeVisible();
        await page.getByRole('button', { name: /Sales by category/ }).click();
        const savedChartResult = page.getByLabel('Saved chart result');
        await expect(savedChartResult).toBeVisible();
        await expect(savedChartResult.getByTestId('bar-chart-svg')).toBeVisible();
        await expect(
            savedChartResult.getByRole('cell', { name: 'Hardware' })
        ).toBeVisible();

        const renameResponse = page.waitForResponse(
            response =>
                response.url().includes('/api/data/charts/') &&
                response.request().method() === 'PUT'
        );
        await page.getByLabel('Name').fill('Sales by category renamed');
        await page.getByRole('button', { name: /save chart/i }).click();
        expect((await renameResponse).status()).toBe(204);
        await expect(
            page.getByRole('button', { name: /Sales by category renamed/ })
        ).toBeVisible();

        await page.getByRole('link', { name: /dashboards/i }).click();
        await expect(page).toHaveURL(/\/dashboards$/);
        await page.getByLabel('New dashboard').fill('Sales dashboard');

        const createDashboardResponse = page.waitForResponse(
            response =>
                response.url().includes('/api/dashboards') &&
                response.request().method() === 'POST'
        );
        await page.getByRole('button', { name: /^create$/i }).click();
        expect((await createDashboardResponse).status()).toBe(201);
        await expect(page.getByRole('button', { name: /Sales dashboard/ })).toBeVisible();

        const addChartResponse = page.waitForResponse(
            response =>
                response.url().includes('/api/dashboards/') &&
                response.url().includes('/items') &&
                response.request().method() === 'POST'
        );
        await page.getByLabel('Add saved chart').selectOption({
            label: 'Sales by category renamed',
        });
        await page.getByRole('button', { name: /add chart/i }).click();
        expect((await addChartResponse).status()).toBe(201);
        await expect(
            page.getByRole('heading', { name: 'Sales by category renamed' })
        ).toBeVisible();

        const addMetricForm = page.getByRole('form', { name: 'Add metric' });
        await addMetricForm
            .getByLabel('Metric dataset')
            .selectOption({ label: 'wide-sales' });
        await addMetricForm.getByLabel('Metric name').fill('Average sales');
        await addMetricForm.getByLabel('Expression').fill('avg(sales)');
        await addMetricForm.getByLabel('Format').selectOption('number');

        const addMetricResponse = page.waitForResponse(
            response =>
                response.url().includes('/api/dashboards/') &&
                response.url().includes('/items') &&
                response.request().method() === 'POST'
        );
        await addMetricForm.getByRole('button', { name: /add metric/i }).click();
        expect((await addMetricResponse).status()).toBe(201);
        await expect(page.getByRole('heading', { name: 'Average sales' })).toBeVisible();

        const reorderResponse = page.waitForResponse(
            response =>
                response.url().includes('/api/dashboards/') &&
                response.url().includes('/items/order') &&
                response.request().method() === 'PATCH'
        );
        await page.getByRole('button', { name: /Move Average sales up/ }).click();
        expect((await reorderResponse).status()).toBe(204);
        await expect(
            page.getByLabel('Dashboard widgets').locator('h3').first()
        ).toHaveText('Average sales');

        await page.getByRole('button', { name: /load chart data/i }).click();
        await expect(
            page.getByLabel(/Sales by category renamed dashboard chart/)
        ).toBeVisible();
        await expect(
            page
                .getByLabel(/Sales by category renamed dashboard chart/)
                .getByTestId('bar-chart-svg')
        ).toBeVisible();
        await expect(page.getByRole('cell', { name: 'Hardware' })).toBeVisible();

        const removeItemResponse = page.waitForResponse(
            response =>
                response.url().includes('/api/dashboards/') &&
                response.url().includes('/items/') &&
                response.request().method() === 'DELETE'
        );
        await page
            .getByRole('button', { name: /Remove Sales by category renamed/ })
            .click();
        expect((await removeItemResponse).status()).toBe(204);

        const removeMetricResponse = page.waitForResponse(
            response =>
                response.url().includes('/api/dashboards/') &&
                response.url().includes('/items/') &&
                response.request().method() === 'DELETE'
        );
        await page.getByRole('button', { name: /Remove Average sales/ }).click();
        expect((await removeMetricResponse).status()).toBe(204);
        await expect(
            page.getByText('Add a saved chart to this dashboard.')
        ).toBeVisible();

        const deleteDashboardResponse = page.waitForResponse(
            response =>
                response.url().includes('/api/dashboards/') &&
                response.request().method() === 'DELETE'
        );
        await page.getByRole('button', { name: 'Delete', exact: true }).click();
        await page.getByRole('button', { name: 'Confirm delete', exact: true }).click();
        expect((await deleteDashboardResponse).status()).toBe(204);

        await page.getByRole('link', { name: /^charts$/i }).click();
        await expect(page).toHaveURL(/\/charts$/);
        await page.getByRole('button', { name: /Sales by category renamed/ }).click();

        const deleteChartResponse = page.waitForResponse(
            response =>
                response.url().includes('/api/data/charts/') &&
                response.request().method() === 'DELETE'
        );
        await page.getByRole('button', { name: 'Delete', exact: true }).click();
        await page.getByRole('button', { name: 'Confirm delete', exact: true }).click();
        expect((await deleteChartResponse).status()).toBe(204);
        await expect(
            page.getByRole('button', { name: /Sales by category renamed/ })
        ).toBeHidden();

        await page.goto('/datasets');
        await expect(page.getByRole('heading', { name: 'wide-sales' })).toBeVisible();

        const nextRowsResponse = page.waitForResponse(
            response =>
                response.url().includes('/api/data/datasets/') &&
                response.url().includes('/rows?offset=50&limit=50')
        );

        await page.getByLabel('Next rows').click();
        expect((await nextRowsResponse).status()).toBe(200);
        await expect(page.getByText('North-051', { exact: true })).toBeVisible({
            timeout: 30_000,
        });
        await expect(page.getByText('51-100 of 180')).toBeVisible();

        await uploadFixture(
            page,
            {
                name: 'wide-accounts.xlsx',
                mimeType:
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                buffer: await createXlsxFixture(),
            },
            {
                datasetName: 'wide-accounts',
                sourceType: 'xlsx',
                rows: 150,
                columns: 18,
                cell: 'Account-001',
            }
        );

        const deleteResponse = page.waitForResponse(
            response =>
                response.url().includes('/api/data/datasets/') &&
                response.request().method() === 'DELETE'
        );

        await page.getByRole('button', { name: 'Delete', exact: true }).click();
        await page.getByRole('button', { name: 'Confirm delete', exact: true }).click();
        expect((await deleteResponse).status()).toBe(204);
        await expect(page.getByRole('heading', { name: 'wide-accounts' })).toBeHidden();
        await expect(page.getByRole('button', { name: /wide-accounts/ })).toBeHidden();
    });
});
