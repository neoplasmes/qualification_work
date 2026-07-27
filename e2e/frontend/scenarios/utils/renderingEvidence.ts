/// <reference lib="dom" />
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, type Locator, type Page } from '@playwright/test';

type ChartFrame = {
    phase: string;
    width: number;
    step: number;
    open: boolean;
    plot: Awaited<ReturnType<Locator['boundingBox']>>;
    card: Awaited<ReturnType<Locator['boundingBox']>>;
    summary: Awaited<ReturnType<Locator['boundingBox']>>;
    table: Awaited<ReturnType<Locator['boundingBox']>>;
    marks?: Array<{
        x: number;
        y: number;
        width: number;
        height: number;
        fill: string;
    }>;
    text?: string[];
};

export async function captureResponsivePages({
    page,
    screenshots,
    name,
    widths,
    visible,
}: {
    page: Page;
    screenshots: string;
    name: string;
    widths: number[];
    visible?: Locator;
}) {
    for (const width of widths) {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
        if (visible) {
            await expect(visible).toBeVisible();
        }
        await page.screenshot({
            path: path.join(screenshots, `${name}-${width}.png`),
            fullPage: true,
        });
    }
}

export async function expectChartRows(chart: Locator, values: Array<[string, string]>) {
    for (const [category, value] of values) {
        await expect(
            chart.getByRole('row').filter({
                has: chart.page().getByRole('cell', { name: category, exact: true }),
            })
        ).toContainText(value);
    }
}

export async function captureChartStates({
    page,
    card,
    screenshots,
    name,
    record,
    widths,
    values,
    tableValue,
    desktopCategories = [],
    activation = 'click',
}: {
    page: Page;
    card: Locator;
    screenshots: string;
    name: string;
    record: string;
    widths: number[];
    values: string[];
    tableValue: string;
    desktopCategories?: string[];
    activation?: 'click' | 'keyboard';
}) {
    const frames: ChartFrame[] = [];
    const plot = card.getByTestId('bar-chart-svg').locator('svg').first();
    const summary = card.locator('summary');
    for (const [step, width] of widths.entries()) {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
        await writeFile(
            path.join(
                screenshots,
                `${record.replace(/s\.json$/, '')}-before-${step}.json`
            ),
            JSON.stringify(
                {
                    width,
                    step,
                    plot: await plot.boundingBox(),
                    card: await card.boundingBox(),
                },
                null,
                2
            )
        );
        await expect
            .poll(async () => (await plot.boundingBox())?.width ?? 0)
            .toBeGreaterThan(200);
        await expect
            .poll(async () => (await plot.boundingBox())?.height ?? 0)
            .toBeGreaterThan(140);
        for (const open of [false, true]) {
            if (open) {
                if (activation === 'keyboard') {
                    await expect(summary).toBeFocused();
                    await page.keyboard.press('Enter');
                } else {
                    await summary.click();
                }
                await expect(card.getByRole('table')).toContainText(tableValue);
            }
            const categories = width === 1440 ? desktopCategories : [];
            const captureName = `${name}-${width}-${step}-${open ? 'open' : 'closed'}`;
            const frame = {
                phase: 'before',
                width,
                step,
                open,
                plot: await plot.boundingBox(),
                card: await card.boundingBox(),
                summary: await summary.boundingBox(),
                table: open ? await card.getByRole('table').boundingBox() : null,
            };
            frames.push(frame);
            await writeFile(
                path.join(screenshots, record),
                JSON.stringify(frames, null, 2)
            );
            await expect
                .poll(async () => {
                    const plotBounds = await plot.boundingBox();
                    const summaryBounds = await summary.boundingBox();

                    return {
                        readable: Boolean(
                            plotBounds &&
                            plotBounds.width > 200 &&
                            plotBounds.height > 140
                        ),
                        separated: Boolean(
                            plotBounds &&
                            summaryBounds &&
                            plotBounds.y + plotBounds.height <= summaryBounds.y + 1
                        ),
                    };
                })
                .toEqual({ readable: true, separated: true });
            await plot.scrollIntoViewIfNeeded();
            await expect(plot).toBeInViewport({ ratio: 0.9 });
            await expect
                .poll(() =>
                    plot.locator('.visx-bar').evaluateAll(
                        elements =>
                            elements.filter(element => {
                                const bounds = element.getBoundingClientRect();
                                const style = getComputedStyle(element);

                                return (
                                    bounds.width > 10 &&
                                    bounds.height > 10 &&
                                    style.fill !== 'none' &&
                                    style.visibility !== 'hidden' &&
                                    Number(style.opacity) > 0
                                );
                            }).length
                    )
                )
                .toBe(values.length);
            await expect
                .poll(() => plot.locator('text').allTextContents())
                .toEqual(expect.arrayContaining(values));
            await expect
                .poll(() =>
                    plot.locator('.visx-axis-line').evaluateAll(
                        elements =>
                            elements.filter(element => {
                                const bounds = element.getBoundingClientRect();

                                return Math.max(bounds.width, bounds.height) > 100;
                            }).length
                    )
                )
                .toBe(2);
            if (categories.length) {
                await expect
                    .poll(() => plot.locator('text').allTextContents())
                    .toEqual(expect.arrayContaining(categories));
            }
            const settled = {
                ...frame,
                phase: 'settled',
                marks: await plot.locator('.visx-bar').evaluateAll(elements =>
                    elements.map(element => {
                        const bounds = element.getBoundingClientRect();

                        return {
                            x: bounds.x,
                            y: bounds.y,
                            width: bounds.width,
                            height: bounds.height,
                            fill: getComputedStyle(element).fill,
                        };
                    })
                ),
                text: await plot.locator('text').allTextContents(),
                plot: await plot.boundingBox(),
                card: await card.boundingBox(),
                summary: await summary.boundingBox(),
                table: open ? await card.getByRole('table').boundingBox() : null,
            };
            frames.push(settled);
            await writeFile(
                path.join(screenshots, record),
                JSON.stringify(frames, null, 2)
            );
            if (open) {
                const tableBounds = await card.getByRole('table').boundingBox();
                const summaryBounds = await summary.boundingBox();
                expect(tableBounds!.y).toBeGreaterThanOrEqual(
                    summaryBounds!.y + summaryBounds!.height - 1
                );
            }
            await page.screenshot({
                path: path.join(screenshots, `${captureName}.png`),
                fullPage: true,
            });
            await page.screenshot({
                path: path.join(screenshots, `${captureName}-viewport.png`),
            });
        }
        if (step < widths.length - 1) {
            await summary.click();
        }
    }

    return frames;
}
