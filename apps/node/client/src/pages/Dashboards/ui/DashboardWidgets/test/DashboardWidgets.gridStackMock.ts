import { vi, type Mock } from 'vitest';

type Widget = {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
    el?: HTMLElement;
};

type GridMockGrid = {
    engine: { nodes: Widget[] };
    addWidget: Mock<(widget: Widget) => HTMLElement>;
    update: Mock<(element: HTMLElement, widget: Widget) => GridMockGrid>;
    removeWidget: Mock<(element: HTMLElement) => GridMockGrid>;
    batchUpdate: Mock<(commit?: boolean) => GridMockGrid>;
    on: Mock<(name: string, handler: () => void) => GridMockGrid>;
    off: Mock<(name: string) => GridMockGrid>;
    destroy: Mock<(removeDom?: boolean) => GridMockGrid>;
    getColumn: Mock<() => number>;
    enableMove: Mock<(enabled: boolean) => GridMockGrid>;
    enableResize: Mock<(enabled: boolean) => GridMockGrid>;
};

type GridMocks = {
    grid: GridMockGrid;
    handlers: Map<string, () => void>;
    emit: (name: string) => void;
    node: (id: string) => Widget | undefined;
    reset: () => void;
    setColumn: (value: number) => void;
    setContainer: (value: HTMLElement) => void;
};

const createGridMocks = (): GridMocks => {
    const handlers = new Map<string, () => void>();
    let column = 12;
    let container: HTMLElement | null = null;

    const setAttrs = (element: HTMLElement, widget: Widget) => {
        element.setAttribute('gs-id', widget.id);
        element.setAttribute('gs-x', String(widget.x));
        element.setAttribute('gs-y', String(widget.y));
        element.setAttribute('gs-w', String(widget.w));
        element.setAttribute('gs-h', String(widget.h));
        element.setAttribute('gs-min-w', String(widget.minW));
        element.setAttribute('gs-min-h', String(widget.minH));
    };

    const grid: GridMockGrid = {
        engine: { nodes: [] as Widget[] },
        addWidget: vi.fn((widget: Widget) => {
            const element = document.createElement('div');
            element.className = 'grid-stack-item';
            const content = document.createElement('div');
            content.className = 'grid-stack-item-content';
            element.append(content);
            setAttrs(element, widget);
            container?.append(element);
            grid.engine.nodes.push({ ...widget, el: element });

            return element;
        }),
        update: vi.fn((element: HTMLElement, widget: Widget) => {
            const node = grid.engine.nodes.find(item => item.el === element);
            if (node) {
                Object.assign(node, widget);
                setAttrs(element, node);
            }

            return grid;
        }),
        removeWidget: vi.fn((element: HTMLElement) => {
            grid.engine.nodes = grid.engine.nodes.filter(item => item.el !== element);
            element.remove();

            return grid;
        }),
        batchUpdate: vi.fn((_commit?: boolean) => grid),
        on: vi.fn((name: string, handler: () => void) => {
            handlers.set(name, handler);

            return grid;
        }),
        off: vi.fn((name: string) => {
            handlers.delete(name);

            return grid;
        }),
        destroy: vi.fn((_removeDom?: boolean) => grid),
        getColumn: vi.fn(() => column),
        enableMove: vi.fn((_enabled: boolean) => grid),
        enableResize: vi.fn((_enabled: boolean) => grid),
    };

    return {
        grid,
        handlers,
        emit: (name: string) => handlers.get(name)?.(),
        node: (id: string) => grid.engine.nodes.find(item => item.id === id),
        reset: () => {
            handlers.clear();
            column = 12;
            container = null;
            grid.engine.nodes = [];
            grid.addWidget.mockClear();
            grid.update.mockClear();
            grid.removeWidget.mockClear();
            grid.batchUpdate.mockClear();
            grid.on.mockClear();
            grid.off.mockClear();
            grid.destroy.mockClear();
            grid.getColumn.mockClear();
            grid.enableMove.mockClear();
            grid.enableResize.mockClear();
        },
        setColumn: (value: number) => {
            column = value;
        },
        setContainer: (value: HTMLElement) => {
            container = value;
        },
    };
};

export const gridMocks = createGridMocks();
