import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Modal } from './Modal';

describe('Modal', () => {
    it('closes from close button, backdrop and Escape', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();

        const { rerender, container } = render(
            <Modal title="Settings" onClose={onClose}>
                Content
            </Modal>
        );

        await user.click(screen.getByRole('button', { name: 'Close modal' }));
        expect(onClose).toHaveBeenCalledTimes(1);

        rerender(
            <Modal title="Settings" onClose={onClose}>
                Content
            </Modal>
        );
        fireEvent.click(container.firstElementChild as Element);
        expect(onClose).toHaveBeenCalledTimes(2);

        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onClose).toHaveBeenCalledTimes(3);
    });
});
