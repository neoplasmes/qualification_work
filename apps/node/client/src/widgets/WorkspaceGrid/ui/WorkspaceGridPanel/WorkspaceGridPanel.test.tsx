import { render } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { WorkspaceGridPanel, WorkspaceGridPanelInternal } from './WorkspaceGridPanel';

const external = (text: string) =>
    createElement(
        WorkspaceGridPanel,
        { initialSize: '100px', minSize: '0px', maxSize: '200px' },
        text
    );

describe('WorkspaceGridPanel', () => {
    it('renders its children through', () => {
        const { getByText } = render(external('content'));

        expect(getByText('content')).toBeInTheDocument();
    });
});

describe('WorkspaceGridPanelInternal', () => {
    it('attaches the panel element on mount', () => {
        const attach = vi.fn();
        render(
            createElement(WorkspaceGridPanelInternal, { attach, external: external('x') })
        );

        expect(attach).toHaveBeenCalledOnce();
        expect(attach.mock.calls[0][0]).toBeInstanceOf(HTMLDivElement);
    });

    it('marks the wrapper hidden when collapsed', () => {
        const { container, rerender } = render(
            createElement(WorkspaceGridPanelInternal, {
                attach: vi.fn(),
                external: external('x'),
                hidden: true,
            })
        );

        expect(container.querySelector('[data-p="md"]')).toHaveAttribute('data-hidden');

        rerender(
            createElement(WorkspaceGridPanelInternal, {
                attach: vi.fn(),
                external: external('x'),
                hidden: false,
            })
        );

        expect(container.querySelector('[data-p="md"]')).not.toHaveAttribute(
            'data-hidden'
        );
    });
});
