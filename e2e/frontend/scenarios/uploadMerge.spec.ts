/// <reference lib="dom" />
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { expect, test } from '@playwright/test';

const screenshots = path.resolve(
    import.meta.dirname,
    `../../../apps/client/dist/migration-review/${new Date().toISOString().replaceAll(':', '-')}-uploadMerge`
);

test('uploads multipart files and merges into the returned table', async ({
    page,
    request,
}) => {
    test.setTimeout(180_000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
        if (message.type() === 'error') {
            errors.push(message.text());
        }
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    const user = {
        email: `upload-${randomUUID()}@example.com`,
        password: 'S3curePassword!',
        name: 'Upload',
        family: 'Tester',
    };
    expect((await request.post('/api/auth/register', { data: user })).ok()).toBe(true);
    await page.goto('/sign-in');
    await page.getByLabel('Электронная почта').fill(user.email);
    await page.getByLabel('Пароль').fill(user.password);
    await page.getByRole('button', { name: 'Войти', exact: true }).click();
    await expect(page).toHaveURL(/\/datasets$/);
    const workspace = page.locator('[style*="--direction"]').first();
    const before = await workspace
        .locator(':scope > [data-p]')
        .evaluateAll(elements =>
            elements.map(element => element.getBoundingClientRect().width)
        );
    const preference = await page.evaluate(() => localStorage.getItem('panelLayout_v2'));
    await page.locator('[data-test-id="datasets-upload-button"]').click();
    await page.getByLabel('Файлы таблицы').setInputFiles([
        {
            name: 'first.csv',
            mimeType: 'text/csv',
            buffer: Buffer.from('sku,amount\nA,10\n'),
        },
        {
            name: 'second.csv',
            mimeType: 'text/csv',
            buffer: Buffer.from('sku,amount\nB,20\n'),
        },
    ]);
    await page.getByRole('radio', { name: 'Одна таблица' }).click();
    await page.getByLabel('Название таблицы').fill('Combined');
    await page.screenshot({
        path: path.join(screenshots, 'upload-desktop.png'),
        fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    console.log(
        'workspace mobile',
        JSON.stringify(
            await workspace.evaluate(element => ({
                direction: getComputedStyle(element).flexDirection,
                widths: [
                    ...element.querySelectorAll<HTMLElement>(':scope > [data-p]'),
                ].map(panel => ({
                    measured: panel.offsetWidth,
                    inline: panel.style.width,
                })),
                preference: localStorage.getItem('panelLayout_v2'),
            }))
        )
    );
    expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
    ).toBe(true);
    const titleBounds = await page
        .getByRole('heading', { name: 'Загрузка таблиц', exact: true })
        .evaluate(element => {
            const title = element.getBoundingClientRect();
            const range = document.createRange();
            range.selectNodeContents(element);
            const text = Array.from(range.getClientRects()).map(rect => ({
                left: rect.left,
                right: rect.right,
                top: rect.top,
                bottom: rect.bottom,
            }));
            const close = element
                .closest('[role="dialog"]')!
                .querySelector('[aria-label="Закрыть окно"]')!
                .getBoundingClientRect();

            return {
                left: title.left,
                right: title.right,
                top: title.top,
                bottom: title.bottom,
                closeLeft: close.left,
                fontSize: getComputedStyle(element).fontSize,
                text,
            };
        });
    console.log('upload phone title bounds', JSON.stringify(titleBounds));
    expect(titleBounds.fontSize).toBe('36px');
    for (const rect of titleBounds.text) {
        expect(rect.right).toBeLessThanOrEqual(titleBounds.right + 1);
        expect(rect.bottom).toBeLessThanOrEqual(titleBounds.bottom + 1);
        expect(rect.right).toBeLessThanOrEqual(titleBounds.closeLeft - 4);
    }
    await page.screenshot({
        path: path.join(screenshots, 'upload-phone.png'),
        fullPage: true,
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    const after = await workspace.locator(':scope > [data-p]').evaluateAll(elements =>
        elements.map(element => ({
            width: element.getBoundingClientRect().width,
            inline: (element as HTMLElement).style.width,
        }))
    );
    console.log('workspace return', JSON.stringify({ before, after, preference }));
    await expect
        .poll(async () =>
            workspace
                .locator(':scope > [data-p]')
                .evaluateAll(elements =>
                    elements.map(element =>
                        Math.round(element.getBoundingClientRect().width)
                    )
                )
        )
        .toEqual(before.map(Math.round));
    expect(await page.evaluate(() => localStorage.getItem('panelLayout_v2'))).toBe(
        preference
    );
    const created = page.waitForResponse(
        response =>
            /\/merge\/[^/]+\/commit\?/.test(response.url()) &&
            response.request().method() === 'POST'
    );
    await page.getByRole('button', { name: 'Создать одну таблицу' }).click();
    const creation = await created;
    expect(creation.ok()).toBe(true);
    const initial = await creation.json();
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByTestId('glide-cell-1-0')).toHaveText('A');
    await expect(page.getByTestId('glide-cell-1-1')).toHaveText('B');
    await page.getByRole('button', { name: 'Объединить данные', exact: true }).click();
    await page.getByLabel('Файлы для объединения').setInputFiles({
        name: 'third.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from('sku,amount\nC,30\n'),
    });
    await page.getByLabel('Создать новую таблицу').check();
    await page.getByLabel('Название таблицы').fill('Combined copy');
    const previewResponse = page.waitForResponse(
        response =>
            response.url().includes('/merge/preview') &&
            response.request().method() === 'POST'
    );
    await page.getByRole('button', { name: 'Проверить данные' }).click();
    const preview = await previewResponse;
    expect(preview.ok()).toBe(true);
    expect((await preview.json()).statistics.copiedRows).toBe(2);
    await expect(page.getByRole('button', { name: 'Подтвердить' })).toBeEnabled();
    await page.screenshot({
        path: path.join(screenshots, 'merge-preview-desktop.png'),
        fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
    ).toBe(true);
    await page.screenshot({
        path: path.join(screenshots, 'merge-preview-phone.png'),
        fullPage: true,
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    const committed = page.waitForResponse(
        response =>
            /\/merge\/[^/]+\/commit\?/.test(response.url()) &&
            response.request().method() === 'POST'
    );
    await page.getByRole('button', { name: 'Подтвердить' }).click();
    const confirmed = await committed;
    expect(confirmed.ok()).toBe(true);
    const result = await confirmed.json();
    expect(result.datasetId).not.toBe(initial.datasetId);
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByTestId('glide-cell-1-2')).toHaveText('C');
    await expect(
        page.locator('[data-test-id="datasets-list-item"][aria-current]')
    ).toContainText('Combined copy');

    await page.getByRole('button', { name: 'Объединить данные', exact: true }).click();
    await page.getByLabel('Файлы для объединения').setInputFiles({
        name: 'cancel.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from('sku,amount\nD,40\n'),
    });
    await page.getByRole('button', { name: 'Проверить данные' }).click();
    await expect(page.getByRole('button', { name: 'Подтвердить' })).toBeVisible();
    const cancelled = page.waitForResponse(
        response =>
            response.url().includes('/merge/') && response.request().method() === 'DELETE'
    );
    await page.getByRole('button', { name: 'Закрыть окно' }).click();
    const cancellation = await cancelled;
    expect(cancellation.status()).toBe(204);
    expect(new URL(cancellation.url()).searchParams.get('orgId')).toBeTruthy();
    for (const variant of ['custom', 'collapsed']) {
        if (variant === 'custom') {
            await page.evaluate(() =>
                localStorage.setItem(
                    'panelLayout_v2',
                    JSON.stringify({
                        sizes: { workspace: [360, 684, 340] },
                        isLeftCollapsed: false,
                        isRightCollapsed: false,
                    })
                )
            );
            await page.reload();
            await expect(page.getByTestId('glide-cell-1-2')).toHaveText('C');
        } else {
            await page
                .getByRole('button', { name: 'Скрыть левую панель', exact: true })
                .click();
            await expect(
                page.getByRole('button', { name: 'Показать левую панель', exact: true })
            ).toBeVisible();
        }
        const panels = workspace.locator(':scope > [data-p]');
        const original = await panels.evaluateAll(elements =>
            elements.map(element => element.getBoundingClientRect().width)
        );
        if (variant === 'custom') {
            expect(Math.abs(original[0]! - 360)).toBeLessThan(2);
            expect(Math.abs(original[2]! - 340)).toBeLessThan(2);
        }
        const persisted = await page.evaluate(() =>
            localStorage.getItem('panelLayout_v2')
        );
        for (let attempt = 0; attempt < 2; attempt++) {
            await page.setViewportSize({ width: 390, height: 844 });
            await expect
                .poll(() =>
                    workspace.evaluate(element => getComputedStyle(element).flexDirection)
                )
                .toBe('column');
            console.log(
                'workspace variant phone',
                variant,
                JSON.stringify(
                    await panels.evaluateAll(elements =>
                        elements.map(element => ({
                            width: element.getBoundingClientRect().width,
                            inline: (element as HTMLElement).style.width,
                            hidden: element.hasAttribute('data-hidden'),
                        }))
                    )
                )
            );
            await page.setViewportSize({ width: 1440, height: 1000 });
            await expect
                .poll(async () => {
                    const actual = await panels.evaluateAll(elements =>
                        elements.map(element => element.getBoundingClientRect().width)
                    );

                    return actual.every(
                        (width, index) => Math.abs(width - original[index]!) < 2
                    );
                })
                .toBe(true);
            expect(
                await page.evaluate(() => localStorage.getItem('panelLayout_v2'))
            ).toBe(persisted);
        }
        console.log(
            'workspace variant return',
            variant,
            JSON.stringify({
                original,
                persisted,
                restored: await panels.evaluateAll(elements =>
                    elements.map(element => element.getBoundingClientRect().width)
                ),
            })
        );
        await page.screenshot({
            path: path.join(screenshots, `workspace-${variant}-return.png`),
            fullPage: true,
        });
    }
    await page
        .getByRole('button', { name: 'Показать левую панель', exact: true })
        .click();
    await expect
        .poll(async () =>
            Math.abs(
                (await workspace.locator(':scope > [data-p]').first().boundingBox())!
                    .width - 360
            )
        )
        .toBeLessThan(2);
    expect(errors).toEqual([]);
});
