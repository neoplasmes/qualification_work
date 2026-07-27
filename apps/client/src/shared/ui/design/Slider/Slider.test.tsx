import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Slider } from './Slider';

describe('Slider', () => {
    it('renders range input with themed progress', () => {
        render(
            <Slider
                aria-label="Множитель"
                min={0}
                max={100}
                value={25}
                onChange={vi.fn()}
            />
        );

        const slider = screen.getByRole('slider', { name: 'Множитель' });

        expect(slider).toHaveAttribute('type', 'range');
        expect(slider).toHaveStyle('--slider-progress: 25%');
    });
});
