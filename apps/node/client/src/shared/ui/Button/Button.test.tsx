import { render, screen } from '@testing-library/react';
import { Check, X } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import { Button, IconButton } from './Button';

describe('Button', () => {
    it('disables button while loading and keeps label visible', () => {
        const onClick = vi.fn();

        render(
            <Button isLoading onClick={onClick}>
                Save
            </Button>
        );

        expect(screen.getByRole('button', { name: /Save/ })).toBeDisabled();
        expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });

    it('renders icon button disabled loading state', () => {
        render(
            <IconButton isLoading aria-label="Refresh">
                <Check aria-hidden />
            </IconButton>
        );

        expect(screen.getByRole('button', { name: 'Refresh' })).toBeDisabled();
    });

    it('renders icon child and forwards layout padding attribute', () => {
        render(
            <IconButton data-p="none" aria-label="Close">
                <X aria-hidden />
            </IconButton>
        );

        const button = screen.getByRole('button', { name: 'Close' });
        expect(button).toHaveAttribute('data-p', 'none');
        expect(button.querySelector('svg')).toBeInTheDocument();
        expect(button).not.toHaveAttribute('style');
    });
});
