import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { Modal } from './Modal';

it('contains keyboard focus and restores the opener', () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const close = vi.fn();
    const mounted = render(
        <Modal title="Edit" onClose={close}>
            <input aria-label="Name" />
            <button>Save</button>
        </Modal>
    );
    const first = screen.getByRole('button', { name: 'Close modal' });
    const last = screen.getByRole('button', { name: 'Save' });
    expect(first).toHaveFocus();
    last.focus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(first).toHaveFocus();
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
    fireEvent.keyDown(last, { key: 'Escape' });
    expect(close).toHaveBeenCalledOnce();
    mounted.unmount();
    expect(opener).toHaveFocus();
    opener.remove();
});
