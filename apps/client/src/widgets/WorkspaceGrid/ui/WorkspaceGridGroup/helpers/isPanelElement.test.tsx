import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { WorkspaceGridPanel } from '../../WorkspaceGridPanel';
import { isPanelElement } from './isPanelElement';

const panel = () =>
    createElement(WorkspaceGridPanel, {
        initialSize: '100px',
        minSize: '0px',
        maxSize: '200px',
    });

describe('isPanelElement', () => {
    it('accepts WorkspaceGridPanel elements', () => {
        expect(isPanelElement(panel())).toBe(true);
    });

    it('rejects non-panel nodes and warns', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

        expect(isPanelElement(createElement('div'))).toBe(false);
        expect(isPanelElement('text')).toBe(false);
        expect(isPanelElement(null)).toBe(false);
        expect(isPanelElement(42)).toBe(false);

        expect(warn).toHaveBeenCalled();
        warn.mockRestore();
    });
});
