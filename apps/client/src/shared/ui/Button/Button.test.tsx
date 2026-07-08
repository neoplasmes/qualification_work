import { render, screen } from '@testing-library/react';
import { Check, X } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import { Button, IconButton } from './Button';

describe('Button', () => {
    it('replaces the leading icon with a matching loader while loading', () => {
        render(
            <Button isLoading>
                <Check size={18} strokeWidth={2.6} aria-hidden />
                Save
            </Button>
        );

        const button = screen.getByRole('button', { name: /Save/ });
        const icons = button.querySelectorAll('svg');

        expect(icons).toHaveLength(1);
        expect(icons[0]).toHaveAttribute('width', '18');
        expect(icons[0]).toHaveAttribute('height', '18');
        expect(icons[0]).toHaveAttribute('stroke-width', '2.6');
    });

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

    it('renders icon button disabled loading state with matching loader size', () => {
        render(
            <IconButton isLoading iconStrokeWidth={2.8} aria-label="Refresh">
                <Check size={20} aria-hidden />
            </IconButton>
        );

        const button = screen.getByRole('button', { name: 'Refresh' });
        const icon = button.querySelector('svg');

        expect(button).toBeDisabled();
        expect(icon).toHaveAttribute('width', '20');
        expect(icon).toHaveAttribute('height', '20');
        expect(icon).toHaveAttribute('stroke-width', '2.8');
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
