import type { Page } from '@playwright/test';

export async function fillSetAmountAction(page: Page, datasetId: string) {
    const form = page.locator('[data-test-id="actions-configure-form"]');
    await form.locator('[data-test-id="actions-action-name-input"]').fill('Set amount');

    const parameter = form.locator('[data-test-id="actions-parameter-row"]');
    await parameter
        .locator('[data-test-id="actions-parameter-label-input"]')
        .fill('New amount');
    await parameter
        .locator('[data-test-id="actions-parameter-key-input"]')
        .fill('newAmount');
    await parameter
        .locator('[data-test-id="actions-parameter-type-select"]')
        .selectOption('number');
    await parameter
        .locator('[data-test-id="actions-parameter-required-checkbox"]')
        .check();

    const effect = form.locator('[data-test-id="actions-effect-card"]');
    await effect
        .locator('[data-test-id="actions-effect-type-select"]')
        .selectOption('updateRowsByMatch');
    await effect
        .locator('[data-test-id="actions-effect-dataset-select"]')
        .selectOption(datasetId);
    await effect
        .locator('[data-test-id="actions-effect-match-column-select"]')
        .selectOption('sku');
    await effect
        .locator('[data-test-id="actions-effect-match-source-literal-button"]')
        .click();
    await effect.locator('[data-test-id="actions-effect-match-literal-input"]').fill('A');
    await effect.locator('[data-test-id="actions-effect-max-rows-input"]').fill('1');

    const mapping = effect.locator('[data-test-id="actions-mapping-row"]');
    await mapping
        .locator('[data-test-id="actions-mapping-column-select"]')
        .selectOption('amount');
    await mapping
        .locator('[data-test-id="actions-mapping-parameter-select"]')
        .selectOption('newAmount');
    await mapping
        .locator('[data-test-id="actions-mapping-operation-select"]')
        .selectOption('=');

    return form;
}
