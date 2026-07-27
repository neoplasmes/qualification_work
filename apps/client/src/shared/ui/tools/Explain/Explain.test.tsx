import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Explain } from './Explain';

describe('Explain', () => {
    it('renders an accessible explanation trigger and tooltip', () => {
        render(
            <Explain
                label="Как работает направление цели"
                description="Colors target status."
            />
        );

        expect(screen.getByLabelText('Как работает направление цели')).toHaveAttribute(
            'aria-describedby'
        );
        expect(screen.getByRole('tooltip')).toHaveTextContent('Colors target status.');
    });
});
