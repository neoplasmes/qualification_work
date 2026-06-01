import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import {
    afterAll,
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import {
    panelLayoutSlice,
    type PanelLayoutState,
    type WorkspaceGridCollapseController,
} from '../../model';
import { WorkspaceGrid } from '../WorkspaceGrid';

// controllable container size, applyFit reads clientWidth/clientHeight
let mockClientSize = 0;

beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
        configurable: true,
        get: () => mockClientSize,
    });
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
        configurable: true,
        get: () => mockClientSize,
    });
});

afterAll(() => {
    Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth');
    Reflect.deleteProperty(HTMLElement.prototype, 'clientHeight');
});

beforeEach(() => {
    mockClientSize = 0;
});

const controllerFor = (keys: string[]): WorkspaceGridCollapseController => {
    const collapsed = new Set(keys);

    return {
        collapsed,
        isCollapsed: key => collapsed.has(key),
        collapse: () => {},
        expand: () => {},
        toggle: () => {},
    };
};

const renderGroup = (ui: ReactNode, preloaded?: Partial<PanelLayoutState>) => {
    const store = configureStore({
        reducer: { panelLayout: panelLayoutSlice.reducer },
        preloadedState: preloaded
            ? {
                  panelLayout: {
                      sizes: {},
                      isLeftCollapsed: false,
                      isRightCollapsed: false,
                      ...preloaded,
                  },
              }
            : undefined,
    });

    return { store, ...render(<Provider store={store}>{ui}</Provider>) };
};

const groupOf = (container: HTMLElement) => container.firstChild as HTMLElement;
const panelsOf = (group: HTMLElement) =>
    ([...group.children] as HTMLElement[]).filter(child => child.hasAttribute('data-p'));
const resizersOf = (group: HTMLElement) =>
    ([...group.children] as HTMLElement[]).filter(child => !child.hasAttribute('data-p'));

const panel = (key: string | undefined, size = '200px') => (
    <WorkspaceGrid.Panel
        key={key ?? 'c'}
        panelKey={key}
        initialSize={size as `${number}px`}
        minSize="100px"
        maxSize="800px"
    >
        <div>{key ?? 'center'}</div>
    </WorkspaceGrid.Panel>
);

describe('WorkspaceGridGroup structure', () => {
    it('renders N panels with N-1 resizers', () => {
        const { container } = renderGroup(
            <WorkspaceGrid.Group direction="row">
                {[panel('a'), panel('b'), panel('c')]}
            </WorkspaceGrid.Group>
        );

        const group = groupOf(container);
        expect(panelsOf(group)).toHaveLength(3);
        expect(resizersOf(group)).toHaveLength(2);
    });

    it('renders a single panel without resizers', () => {
        const { container } = renderGroup(
            <WorkspaceGrid.Group direction="row">{panel('a')}</WorkspaceGrid.Group>
        );

        const group = groupOf(container);
        expect(panelsOf(group)).toHaveLength(1);
        expect(resizersOf(group)).toHaveLength(0);
    });

    it('filters out non-panel children and warns', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const invalidChild = (<div>nope</div>) as unknown as ReactNode &
            Parameters<typeof WorkspaceGrid.Group>[0]['children'];

        const { container } = renderGroup(
            <WorkspaceGrid.Group direction="row">{invalidChild}</WorkspaceGrid.Group>
        );

        expect(panelsOf(groupOf(container))).toHaveLength(0);
        expect(warn).toHaveBeenCalled();
        warn.mockRestore();
    });

    it('exposes direction through a css variable', () => {
        const { container } = renderGroup(
            <WorkspaceGrid.Group direction="column">
                {[panel('a'), panel('b')]}
            </WorkspaceGrid.Group>
        );

        expect(groupOf(container).style.getPropertyValue('--direction')).toBe('column');
    });
});

describe('WorkspaceGridGroup collapse', () => {
    it('hides the first panel and drops one resizer', () => {
        const { container } = renderGroup(
            <WorkspaceGrid.Group direction="row" collapse={controllerFor(['a'])}>
                {[panel('a'), panel('b'), panel('c')]}
            </WorkspaceGrid.Group>
        );

        const group = groupOf(container);
        const panels = panelsOf(group);

        expect(panels).toHaveLength(3);
        expect(panels[0]).toHaveAttribute('data-hidden');
        expect(panels[1]).not.toHaveAttribute('data-hidden');
        expect(resizersOf(group)).toHaveLength(1);
    });

    it('hides a middle panel and wires one resizer between the visible neighbours', () => {
        const { container } = renderGroup(
            <WorkspaceGrid.Group direction="row" collapse={controllerFor(['b'])}>
                {[panel('a'), panel('b'), panel('c')]}
            </WorkspaceGrid.Group>
        );

        const group = groupOf(container);
        expect(panelsOf(group)[1]).toHaveAttribute('data-hidden');
        expect(resizersOf(group)).toHaveLength(1);
    });

    it('drops all resizers when only one panel stays visible', () => {
        const { container } = renderGroup(
            <WorkspaceGrid.Group direction="row" collapse={controllerFor(['a', 'c'])}>
                {[panel('a'), panel('b'), panel('c')]}
            </WorkspaceGrid.Group>
        );

        expect(resizersOf(groupOf(container))).toHaveLength(0);
    });

    it('keeps the same panel node and preserves size across collapse and expand', () => {
        const { container, rerender, store } = renderGroup(
            <WorkspaceGrid.Group direction="row" collapse={controllerFor([])}>
                {[panel('a'), panel('b'), panel('c')]}
            </WorkspaceGrid.Group>
        );

        const nodeBefore = panelsOf(groupOf(container))[0];

        rerender(
            <Provider store={store}>
                <WorkspaceGrid.Group direction="row" collapse={controllerFor(['a'])}>
                    {[panel('a'), panel('b'), panel('c')]}
                </WorkspaceGrid.Group>
            </Provider>
        );

        const nodeCollapsed = panelsOf(groupOf(container))[0];
        expect(nodeCollapsed).toBe(nodeBefore);
        expect(nodeCollapsed).toHaveAttribute('data-hidden');

        rerender(
            <Provider store={store}>
                <WorkspaceGrid.Group direction="row" collapse={controllerFor([])}>
                    {[panel('a'), panel('b'), panel('c')]}
                </WorkspaceGrid.Group>
            </Provider>
        );

        const nodeExpanded = panelsOf(groupOf(container))[0];
        expect(nodeExpanded).toBe(nodeBefore);
        expect(nodeExpanded).not.toHaveAttribute('data-hidden');
    });
});

describe('WorkspaceGridGroup fit', () => {
    it('fits panels to the container on mount', () => {
        mockClientSize = 1000;

        const { container } = renderGroup(
            <WorkspaceGrid.Group direction="row">
                {[panel('a'), panel('b'), panel('c')]}
            </WorkspaceGrid.Group>
        );

        // overflow path: each visible panel shrinks below its measured 640
        const width = parseFloat(panelsOf(groupOf(container))[0].style.width);
        expect(width).toBeGreaterThan(0);
        expect(width).toBeLessThan(640);
    });

    it('refits when the container is resized', () => {
        // holder avoids flow-narrowing the callback to null at the call site
        const ro: { callback: ResizeObserverCallback | null } = { callback: null };

        class ControllableRO {
            constructor(cb: ResizeObserverCallback) {
                ro.callback = cb;
            }
            observe() {}
            unobserve() {}
            disconnect() {}
        }

        // setup.ts installs a writable (but non-configurable) ResizeObserver,
        // assign over it and restore afterwards
        const originalRO = window.ResizeObserver;
        window.ResizeObserver = ControllableRO as unknown as typeof ResizeObserver;
        mockClientSize = 1000;

        const { container } = renderGroup(
            <WorkspaceGrid.Group direction="row">
                {[panel('a'), panel('b'), panel('c')]}
            </WorkspaceGrid.Group>
        );

        const before = parseFloat(panelsOf(groupOf(container))[0].style.width);

        mockClientSize = 600;
        ro.callback?.([], {} as ResizeObserver);

        const after = parseFloat(panelsOf(groupOf(container))[0].style.width);
        expect(after).toBeLessThan(before);

        window.ResizeObserver = originalRO;
    });

    it('restores saved sizes from the store', () => {
        const { container } = renderGroup(
            <WorkspaceGrid.Group direction="row" pageKey="workspace">
                {[panel('a'), panel('b'), panel('c')]}
            </WorkspaceGrid.Group>,
            { sizes: { workspace: [500, 600, 700] } }
        );

        const panels = panelsOf(groupOf(container));
        expect(panels[0]).toHaveStyle({ width: '500px' });
        expect(panels[1]).toHaveStyle({ width: '600px' });
        expect(panels[2]).toHaveStyle({ width: '700px' });
    });

    it('expands the configured grow panel when the left panel is collapsed', () => {
        mockClientSize = 1400;

        const { container } = renderGroup(
            <WorkspaceGrid.Group
                direction="row"
                growPanelKey="center"
                collapse={controllerFor(['left'])}
            >
                {[panel('left'), panel('center'), panel('right')]}
            </WorkspaceGrid.Group>
        );

        const panels = panelsOf(groupOf(container));

        expect(panels[0]).toHaveAttribute('data-hidden');
        expect(panels[1]).toHaveStyle({ width: '752px' });
        expect(panels[2]).toHaveStyle({ width: '200px' });
    });
});

describe('WorkspaceGridGroup persistence', () => {
    beforeEach(() => {
        vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
            cb(0);

            return 1;
        });
        vi.stubGlobal('cancelAnimationFrame', () => {});
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('persists panel sizes on resize end', () => {
        const { container, store } = renderGroup(
            <WorkspaceGrid.Group direction="row" pageKey="workspace">
                {[panel('a'), panel('b'), panel('c')]}
            </WorkspaceGrid.Group>
        );

        const handle = resizersOf(groupOf(container))[0].firstChild as HTMLElement;
        handle.setPointerCapture = vi.fn();

        fireEvent.pointerDown(handle, { pointerId: 1, clientX: 100 });
        fireEvent.pointerUp(handle, { pointerId: 1 });

        expect(store.getState().panelLayout.sizes.workspace).toEqual([640, 640, 640]);
    });
});
