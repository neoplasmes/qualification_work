import type { WorkspaceGridGroupDirection } from './types';

type WorkspaceGridPanelElement = HTMLElement;

type CSSPixelSize = `${number}px`;

/**
 * All functions are arrow in orger to not lose the context of this after
 * these functions are passed to some other components and called in them
 *
 * @export
 * @class WorkspaceGridPanelModel
 */
export class WorkspaceGridPanelModel {
    private element: WorkspaceGridPanelElement | null = null;
    private readonly initialSizePx: number;
    private readonly minSizePx: number;
    private readonly maxSizePx: number;

    constructor(
        private readonly direction: WorkspaceGridGroupDirection,
        public readonly initialSize: CSSPixelSize,
        public readonly minSize: CSSPixelSize,
        public readonly maxSize: CSSPixelSize,
        private readonly id: string = ''
    ) {
        this.initialSizePx = this.parsePixelSize(initialSize);
        this.minSizePx = this.parsePixelSize(minSize);
        this.maxSizePx = this.parsePixelSize(maxSize);

        if (this.minSizePx > this.maxSizePx) {
            throw new Error(
                `WorkspaceGridPanelModel(${this.id}): minSize can not be greater than maxSize`
            );
        }
    }

    public getElement = () => {
        return this.element;
    };

    public getMinSizePx = () => {
        return this.minSizePx;
    };

    public getMaxSizePx = () => {
        return this.maxSizePx;
    };

    public getInitialSizePx = () => {
        return this.initialSizePx;
    };

    public getCurrentSizePx = () => {
        if (!this.element) {
            throw new Error('incorrect usage of the model');
        }

        return this.direction === 'row'
            ? this.element.offsetWidth
            : this.element.offsetHeight;
    };

    public attach = (element: WorkspaceGridPanelElement | null) => {
        this.element = element;

        this.applyAxisConstraints();
        this.setSizePx(this.initialSizePx);
    };

    public setSizePx = (size: number) => {
        const nextSizePx = Math.min(this.maxSizePx, Math.max(this.minSizePx, size));

        this.applySizePx(nextSizePx);

        return nextSizePx;
    };

    public setFittedSizePx = (size: number) => {
        const nextSizePx = Math.min(this.maxSizePx, Math.max(0, size));

        this.applySizePx(nextSizePx);

        return nextSizePx;
    };

    private applySizePx = (size: number) => {
        const nextSize = `${size}px`;

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
            throw new Error('wrong size format');
        }

        const parsed = Number.parseFloat(size);

        if (!Number.isFinite(parsed)) {
            throw new Error('wrong size format');
        }

        return parsed;
    };
}
