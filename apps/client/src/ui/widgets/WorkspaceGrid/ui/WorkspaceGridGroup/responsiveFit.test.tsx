import { createUiTestRuntime, UiTestProvider } from '@/test/uiRuntime';
import { act, render } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { WorkspaceGrid } from '../../WorkspaceGrid.widget';

it('preserves desktop inline sizes while CSS stacks row panels', () => {
    let callback: ResizeObserverCallback | undefined;
    const original = window.ResizeObserver;
    window.ResizeObserver = class {
        constructor(next: ResizeObserverCallback) {
            callback = next;
        }
        observe() {}
        unobserve() {}
        disconnect() {}
    } as typeof ResizeObserver;
    const computed = vi.spyOn(window, 'getComputedStyle');
    const store = createUiTestRuntime();
    try {
        const { container } = render(
            <UiTestProvider store={store}>
                <WorkspaceGrid>
                    <WorkspaceGrid.Group direction="row">
                        <WorkspaceGrid.Panel
                            initialSize="320px"
                            minSize="300px"
                            maxSize="800px"
                        >
                            <div>Left</div>
                        </WorkspaceGrid.Panel>
                        <WorkspaceGrid.Panel
                            initialSize="800px"
                            minSize="600px"
                            maxSize="9999px"
                        >
                            <div>Center</div>
                        </WorkspaceGrid.Panel>
                    </WorkspaceGrid.Group>
                </WorkspaceGrid>
            </UiTestProvider>
        );
        const group = container.querySelector<HTMLElement>('[style*="--direction"]')!;
        const panels = [...group.querySelectorAll<HTMLElement>(':scope > [data-p]')];
        const widths = panels.map(panel => panel.style.width);
        Object.defineProperty(group, 'clientWidth', { value: 350 });
        const css = getComputedStyle(group);
        computed.mockReturnValue({
            ...css,
            flexDirection: 'column',
        } as CSSStyleDeclaration);
        act(() => callback?.([], {} as ResizeObserver));
        expect(panels.map(panel => panel.style.width)).toEqual(widths);
    } finally {
        computed.mockRestore();
        window.ResizeObserver = original;
    }
});
