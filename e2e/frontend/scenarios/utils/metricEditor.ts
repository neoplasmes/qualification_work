import { expect, type Page } from '@playwright/test';

export async function fillMetricEditor(
    page: Page,
    metric: {
        name: string;
        expression: string;
        preview: string;
        datasetId?: string;
        format?: string;
        multiplier?: string;
        target?: string;
    }
) {
    await page
        .locator('[data-test-id="dashboards-open-add-metric-modal-button"]')
        .click();
    const dialog = page.getByRole('dialog', { name: 'Добавить метрику', exact: true });
    if (metric.datasetId) {
        await dialog
            .locator('[data-test-id="dashboards-metric-dataset-select"]')
            .selectOption(metric.datasetId);
    }
    await dialog.getByRole('tab', { name: 'Формула', exact: true }).click();
    await dialog
        .locator('[data-test-id="dashboards-metric-expression-input"]')
        .fill(metric.expression);
    await dialog.getByLabel('Название метрики', { exact: true }).fill(metric.name);
    if (metric.format !== undefined) {
        await dialog.getByLabel('Формат', { exact: true }).fill(metric.format);
    }
    if (metric.multiplier !== undefined) {
        await dialog
            .locator('[data-test-id="dashboards-metric-value-multiplier-input"]')
            .fill(metric.multiplier);
    }
    if (metric.target !== undefined) {
        await dialog.getByRole('spinbutton', { name: /Цель/ }).fill(metric.target);
    }
    await expect(
        dialog.locator('[data-test-id="dashboards-metric-preview-value"]')
    ).toHaveText(metric.preview);

    return dialog;
}
