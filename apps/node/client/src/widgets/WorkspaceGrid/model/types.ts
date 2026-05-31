export type WorkspaceGridGroupDirection = 'row' | 'column';

/**
 * external control over which panels are collapsed, addressed by panel key.
 * the key union K drives intellisense on every method
 */
export type WorkspaceGridCollapseController<K extends string = string> = {
    collapsed: ReadonlySet<K>;
    isCollapsed: (key: K) => boolean;
    collapse: (key: K) => void;
    expand: (key: K) => void;
    toggle: (key: K) => void;
};
