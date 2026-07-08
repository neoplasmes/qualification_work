import type { WorkspaceGridGroupDirection } from './types';

type WorkspaceGridPanelElement = HTMLElement;

type CSSPixelSize = `${number}px`;

/**
 * All functions are arrow in order to not lose the context of "this" after
 * passing these functions to some other components and calling them inside
 *
 * @export
 * @class WorkspaceGridPanelModel
 */
export class WorkspaceGridPanelModel {
    private element: WorkspaceGridPanelElement | null = null;
    private lastSizePx = 0;

    private readonly initialSizePx: number;
    private readonly minSizePx: number;
    private readonly maxSizePx: number;

    constructor(
        private readonly direction: WorkspaceGridGroupDirection,
        public readonly initialSize: CSSPixelSize,
        public readonly minSize: CSSPixelSize,
        public readonly maxSize: CSSPixelSize,
        private readonly id: string = '',
        savedSize?: number
    ) {
        this.initialSizePx = savedSize ?? this.parsePixelSize(initialSize);
        this.minSizePx = this.parsePixelSize(minSize);
        this.maxSizePx = this.parsePixelSize(maxSize);

        if (this.minSizePx > this.maxSizePx) {
            throw new Error(
                this.formatErrorMsg('minSize can not be greater than maxSize')
            );
        }
    }

    getElement = () => {
        return this.element;
    };

    getMinSizePx = () => {
        return this.minSizePx;
    };

    getMaxSizePx = () => {
        return this.maxSizePx;
    };

    getInitialSizePx = () => {
        return this.initialSizePx;
    };

    getCurrentSizePx = () => {
        if (!this.element) {
            throw new Error(this.formatErrorMsg('incorrect usage of the model'));
        }

        const measured =
            this.direction === 'row'
                ? this.element.offsetWidth
                : this.element.offsetHeight;

        // hidden panels measure 0, fall back to the last applied size so collapsed
        // panels keep their width across persistence and re-expansion
        return measured > 0 ? measured : this.lastSizePx;
    };

    attach = (element: WorkspaceGridPanelElement | null) => {
        this.element = element;

        this.applyAxisConstraints();
        this.setSizePx(this.initialSizePx);
    };

    setSizePx = (size: number) => {
        const nextSizePx = Math.min(this.maxSizePx, Math.max(this.minSizePx, size));

        this.applySizePx(nextSizePx);

        return nextSizePx;
    };

    setFittedSizePx = (size: number) => {
        const nextSizePx = Math.min(this.maxSizePx, Math.max(0, size));

        this.applySizePx(nextSizePx);

        return nextSizePx;
    };

    private applySizePx = (size: number) => {
        const nextSize = `${size}px`;

        this.lastSizePx = size;

        if (this.element) {
            if (this.direction === 'row') {
                this.element.style.width = nextSize;
            } else {
                this.element.style.height = nextSize;
            }

            this.element.style.flexBasis = nextSize;
        }
    };

    private applyAxisConstraints = () => {
        if (!this.element) {
            return;
        }

        if (this.direction === 'row') {
            this.element.style.minWidth = '0px';
            this.element.style.maxWidth = this.maxSize;

            return;
        }

        this.element.style.minHeight = '0px';
        this.element.style.maxHeight = this.maxSize;
    };

    private parsePixelSize = (size: string) => {
        if (!size.endsWith('px')) {
            throw new Error(this.formatErrorMsg('wrong size format'));
        }

        const parsed = Number.parseFloat(size);

        if (!Number.isFinite(parsed)) {
            throw new Error(this.formatErrorMsg('wrong size format'));
        }

        return parsed;
    };

    private formatErrorMsg = (msg: string) =>
        `[WorkspaceGridPanelModel(${this.id})]: ${msg}`;
}
