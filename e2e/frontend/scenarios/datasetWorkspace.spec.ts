/// <reference lib="dom" />
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const screenshots = path.resolve(
    import.meta.dirname,
    '../../../apps/client/dist/migration-review/task-9'
);

async function openFirstCell(page: Page, column = 0) {
    const canvas = page.getByTestId('data-grid-canvas');
    const editor = page.locator('#portal textarea.gdg-input');
    await expect(editor).toBeHidden();
    await canvas.press('Escape');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.click(box!.x + 56, box!.y + 57);
    for (let index = 0; index < column; index++) {
        await page.keyboard.press('ArrowRight');
    }
    await page.keyboard.press('Enter');
    await expect(editor).toBeVisible();

    return editor;
}

test('edits a paged dataset and preserves local table preferences', async ({
    page,
    request,
}) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1440, height: 1000 });
    const errors: string[] = [];
    const pages: number[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
        if (message.type() === 'error') {
            errors.push(message.text());
        }
    });
    page.on('request', request => {
        const url = new URL(request.url());
        if (request.method() === 'GET' && /\/datasets\/[^/]+\/rows$/.test(url.pathname)) {
            expect(url.searchParams.get('limit')).toBe('200');
            pages.push(Number(url.searchParams.get('offset')));
        }
    });
    const user = {
        email: `dataset-${randomUUID()}@example.com`,
        password: 'S3curePassword!',
        name: 'Dataset',
        family: 'Tester',
    };
    expect((await request.post('/api/auth/register', { data: user })).ok()).toBe(true);
    await page.goto('/sign-in');
    await page.getByLabel('Электронная почта').fill(user.email);
    await page.getByLabel('Пароль').fill(user.password);
    await page.getByRole('button', { name: 'Войти', exact: true }).click();
    await expect(page).toHaveURL(/\/datasets$/);
    await page.locator('[data-test-id="datasets-upload-button"]').click();
    const csv =
        'sku,amount,note\n' +
        Array.from(
            { length: 451 },
            (_, i) =>
                `R${String(i).padStart(3, '0')},${i + 10},note-${String(i).padStart(3, '0')}`
        ).join('\n') +
        '\n';
    await page.getByLabel('Dataset file').setInputFiles({
        name: 'dataset-workspace.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from(csv),
    });
    const upload = page.waitForResponse(
        response =>
            response.request().method() === 'POST' &&
            /\/data\/datasets\?/.test(response.url())
    );
    await page.getByRole('button', { name: 'Upload dataset', exact: true }).click();
    const uploaded = await upload;
    expect(uploaded.status()).toBe(201);
    const { id: datasetId } = await uploaded.json();
    const rowPath = `/data/datasets/${datasetId}/rows`;
    const canvas = page.getByTestId('data-grid-canvas');
    await expect(canvas).toBeVisible();
    await expect(page.getByTestId('glide-cell-1-0')).toHaveText('R000');
    await expect(page.getByTestId('glide-cell-2-0')).toHaveText('10');
    expect(pages).toEqual([0]);
    await expect(
        page.locator('[data-test-id="datasets-list-item"][aria-current] span').first()
    ).toHaveCSS('color', 'rgb(244, 244, 231)');
    await page.screenshot({
        path: path.join(screenshots, 'desktop-table.png'),
        fullPage: true,
    });

    let editor = await openFirstCell(page, 1);
    await expect(editor).toHaveValue('10');
    const patch = page.waitForResponse(
        response =>
            response.url().includes(rowPath) && response.request().method() === 'PATCH'
    );
    await editor.fill('915');
    await editor.press('Enter');
    const updated = await patch;
    expect(updated.ok()).toBe(true);
    const [confirmed] = await updated.json();
    const amountKey = Object.keys(updated.request().postDataJSON().values)[0]!;
    await expect(page.getByTestId('glide-cell-2-0')).toHaveText('915');
    editor = await openFirstCell(page, 1);
    const clear = page.waitForResponse(
        response =>
            response.url().includes(rowPath) && response.request().method() === 'PATCH'
    );
    await editor.fill('');
    await editor.press('Enter');
    const cleared = await clear;
    expect(cleared.request().postDataJSON()).toEqual({
        rowIds: [confirmed.id],
        values: { [amountKey]: null },
    });
    expect((await cleared.json())[0].data).not.toHaveProperty(amountKey);
    await expect(page.getByTestId('glide-cell-2-0')).toHaveText('');

    const box = (await canvas.boundingBox())!;
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.wheel(0, 34 * 205);
    await expect.poll(() => pages.includes(200)).toBe(true);
    await expect(page.getByTestId('glide-cell-1-205')).toHaveText('R205');
    await expect(page.getByTestId('glide-cell-2-205')).toHaveText('215');
    await page.locator('[data-test-id="datasets-scroll-to-bottom-button"]').click();
    await expect(page.getByTestId('glide-cell-1-450')).toHaveText('R450');
    expect(pages).toContain(400);
    await page.screenshot({
        path: path.join(screenshots, 'last-chunk.png'),
        fullPage: true,
    });
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.wheel(0, -20000);
    await expect(page.getByTestId('glide-cell-1-0')).toHaveText('R000');

    await page.mouse.click(box.x + 56, box.y + 57, { button: 'right' });
    await expect(
        page.locator('[data-test-id="datasets-row-context-menu"]')
    ).toBeVisible();
    const insert = page.waitForResponse(
        response =>
            response.url().includes(rowPath) && response.request().method() === 'POST'
    );
    await page.locator('[data-test-id="datasets-insert-row-menu-item"]').click();
    const inserted = await insert;
    expect(inserted.status()).toBe(201);
    expect(inserted.request().postDataJSON().afterRowId).toBe(confirmed.id);
    const newRow = await inserted.json();
    await expect(page.locator('[aria-rowcount]')).toHaveAttribute('aria-rowcount', '453');
    await expect(page.getByTestId('glide-cell-1-1')).toHaveText('');
    await expect(page.getByTestId('glide-cell-1-2')).toHaveText('R001');
    await page.mouse.click(box.x + 56, box.y + 91, { button: 'right' });
    await page.locator('[data-test-id="datasets-delete-row-menu-item"]').click();
    const remove = page.waitForResponse(
        response =>
            response.url().includes(rowPath) && response.request().method() === 'DELETE'
    );
    await page.locator('[data-test-id="datasets-confirm-delete-row-button"]').click();
    const removed = await remove;
    expect(removed.request().postDataJSON().rowIds).toEqual([newRow.id]);
    expect(removed.ok()).toBe(true);
    await expect(page.locator('[aria-rowcount]')).toHaveAttribute('aria-rowcount', '452');
    await expect(page.getByTestId('glide-cell-1-1')).toHaveText('R001');

    editor = await openFirstCell(page, 1);
    const amountBox = (await page.locator('#portal [id^="gdg-overlay-"]').boundingBox())!;
    await editor.press('Escape');
    await page.mouse.click(amountBox.x + amountBox.width / 2, box.y + 20, {
        button: 'right',
    });
    const toggle = page.waitForResponse(
        response =>
            response.url().includes(`/datasets/${datasetId}/columns/`) &&
            response.request().method() === 'PATCH'
    );
    await page.getByLabel('Использовать в анализе').click();
    expect((await toggle).ok()).toBe(true);
    await expect(
        page.locator('[data-test-id="datasets-column-context-menu"]')
    ).toBeHidden();
    await page.mouse.click(amountBox.x + amountBox.width / 2, box.y + 20, {
        button: 'right',
    });
    await expect(page.getByLabel('Использовать в анализе')).not.toBeChecked();
    await page.keyboard.press('Escape');

    editor = await openFirstCell(page);
    const before = (await page.locator('#portal [id^="gdg-overlay-"]').boundingBox())!;
    await editor.press('Escape');
    await page.mouse.move(before.x + before.width - 1, box.y + 20);
    await page.mouse.down();
    await page.mouse.move(before.x + before.width + 70, box.y + 20, { steps: 12 });
    await page.mouse.up();
    await expect
        .poll(() =>
            page.evaluate(async id => {
                return new Promise<number | undefined>((resolve, reject) => {
                    const opening = indexedDB.open('datasetTableOptions', 1);
                    opening.onerror = () => reject(opening.error);
                    opening.onsuccess = () => {
                        const db = opening.result;
                        const read = db
                            .transaction('tableOptions')
                            .objectStore('tableOptions')
                            .get(id);
                        read.onsuccess = () => {
                            resolve(
                                Object.values(read.result?.columnWidths ?? {})[0] as
                                    | number
                                    | undefined
                            );
                            db.close();
                        };
                        read.onerror = () => {
                            reject(read.error);
                            db.close();
                        };
                    };
                });
            }, datasetId)
        )
        .toBeGreaterThan(0);
    editor = await openFirstCell(page);
    const resized = (await page.locator('#portal [id^="gdg-overlay-"]').boundingBox())!;
    expect(Math.abs(resized.width - before.width)).toBeGreaterThan(10);
    await editor.press('Escape');
    await page.reload();
    await expect(page.getByTestId('glide-cell-1-0')).toHaveText('R000');
    await expect(page.getByTestId('glide-cell-2-0')).toHaveText('');
    editor = await openFirstCell(page);
    expect(
        (await page.locator('#portal [id^="gdg-overlay-"]').boundingBox())!.width
    ).toBeCloseTo(resized.width, 0);
    await editor.press('Escape');
    await page.screenshot({
        path: path.join(screenshots, 'resized-reloaded.png'),
        fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect
        .poll(() =>
            page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
        )
        .toBe(true);
    await page.screenshot({
        path: path.join(screenshots, 'phone-table.png'),
        fullPage: true,
    });
    expect(errors).toEqual([]);
});
