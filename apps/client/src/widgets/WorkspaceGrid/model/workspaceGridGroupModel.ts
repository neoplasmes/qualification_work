type WorkspaceGridPanelElement = HTMLElement;

/**
 * All functions are arrow in orger to not lose the context of this after
 * these functions are passed to some other components and called in them
 *
 * @export
 * @class WorkspaceGridPanelModelHandler
 */
export class WorkspaceGridPanelModelHandler {
    private element: WorkspaceGridPanelElement | null = null;

    public getElement = () => {
        return this.element;
    };

    public attach = (element: WorkspaceGridPanelElement | null) => {
        this.element = element;
    };

    public setWidth = (
        width: Exclude<CSSStyleDeclaration['width'], undefined | number>
    ) => {
        if (this.element) {
            this.element.style.width = width;
        }
    };

    public setHeight = (
        height: Exclude<CSSStyleDeclaration['height'], undefined | number>
    ) => {
        if (this.element) {
            this.element.style.height = height;
        }
    };
}
