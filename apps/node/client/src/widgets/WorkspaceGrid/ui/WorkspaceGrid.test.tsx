import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';

import { panelLayoutSlice, useWorkspaceGridCollapse } from '../model';
import { WorkspaceGrid } from './WorkspaceGrid';
import { WorkspaceGridGroup } from './WorkspaceGridGroup';
import { WorkspaceGridPanel } from './WorkspaceGridPanel';

const withStore = (ui: ReactNode) => {
    const store = configureStore({
        reducer: { panelLayout: panelLayoutSlice.reducer },
    });

    return render(<Provider store={store}>{ui}</Provider>);
};

const groupOf = (container: HTMLElement) =>
    container.querySelector('[style*="--direction"]') as HTMLElement;

const panel = (key?: string) => (
    <WorkspaceGrid.Panel
        key={key ?? 'c'}
        panelKey={key}
        initialSize="200px"
        minSize="100px"
        maxSize="800px"
    >
        <div>{key ?? 'center'}</div>
    </WorkspaceGrid.Panel>
);

describe('WorkspaceGrid', () => {
    it('exposes Group and Panel on the namespace', () => {
        expect(WorkspaceGrid.Group).toBe(WorkspaceGridGroup);
        expect(WorkspaceGrid.Panel).toBe(WorkspaceGridPanel);
    });

    it('defaults the resizer size to 8px', () => {
        const { container } = withStore(
            <WorkspaceGrid>
                <WorkspaceGrid.Group direction="row">
                    {[panel('a'), panel('b')]}
                </WorkspaceGrid.Group>
            </WorkspaceGrid>
        );

        expect(groupOf(container).style.getPropertyValue('--resizer-size')).toBe('8px');
    });

    it('propagates a custom resizer size through context', () => {
        const { container } = withStore(
            <WorkspaceGrid resizerSize={20}>
                <WorkspaceGrid.Group direction="row">
                    {[panel('a'), panel('b')]}
                </WorkspaceGrid.Group>
            </WorkspaceGrid>
        );

        expect(groupOf(container).style.getPropertyValue('--resizer-size')).toBe('20px');
    });

    it('hides a panel end-to-end through the collapse controller', () => {
        const Harness = () => {
            const collapse = useWorkspaceGridCollapse<'left' | 'right'>();

            return (
                <>
                    <button type="button" onClick={() => collapse.toggle('left')}>
                        toggle
                    </button>
                    <WorkspaceGrid>
                        <WorkspaceGrid.Group direction="row" collapse={collapse}>
                            {[panel('left'), panel('right')]}
                        </WorkspaceGrid.Group>
                    </WorkspaceGrid>
                </>
            );
        };

        const { container, getByText } = withStore(<Harness />);

        const leftPanel = () => container.querySelector('[data-p="md"]') as HTMLElement;

        expect(leftPanel()).not.toHaveAttribute('data-hidden');

        fireEvent.click(getByText('toggle'));
        expect(leftPanel()).toHaveAttribute('data-hidden');

        fireEvent.click(getByText('toggle'));
        expect(leftPanel()).not.toHaveAttribute('data-hidden');
    });
});
