import { render, screen } from '@testing-library/react';
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
                R
            </IconButton>
        );

        expect(screen.getByRole('button', { name: 'Refresh' })).toBeDisabled();
    });
});
