import { fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { datasetsTestIds } from '../../../const';

import { DatasetRowContextMenu } from './DatasetRowContextMenu';

const baseProps = {
    state: {
        rowId: 'row-1',
        rowIndex: 10,
        x: 20,
        y: 590,
        mode: 'actions' as const,
    },
    deleting: false,
    onInsertBelow: vi.fn(),
    onAskDelete: vi.fn(),
    onConfirmDelete: vi.fn(),
    onCancel: vi.fn(),
};

const getByDataTestId = (testId: string) => {
    const element = document.querySelector<HTMLElement>(`[data-test-id="${testId}"]`);
    expect(element).not.toBeNull();

    return element as HTMLElement;
};

describe('DatasetRowContextMenu', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('flips above the anchor when it would overflow viewport bottom', () => {
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
            x: 0,
            y: 0,
            width: 220,
            height: 120,
            top: 0,
            right: 220,
            bottom: 120,
            left: 0,
            toJSON: () => ({}),
        });
        Object.defineProperty(window, 'innerWidth', {
            configurable: true,
            value: 800,
        });
        Object.defineProperty(window, 'innerHeight', {
            configurable: true,
            value: 600,
        });

        render(<DatasetRowContextMenu {...baseProps} />);

        expect(getByDataTestId(datasetsTestIds.rowContextMenu)).toHaveStyle({
            top: '462px',
        });
    });

    it('closes on outside pointer down', () => {
        const onCancel = vi.fn();

        render(<DatasetRowContextMenu {...baseProps} onCancel={onCancel} />);
        fireEvent.pointerDown(document.body);

        expect(onCancel).toHaveBeenCalledTimes(1);
    });
});
