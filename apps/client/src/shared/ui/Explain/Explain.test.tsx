import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Explain } from './Explain';

describe('Explain', () => {
    it('renders an accessible explanation trigger and tooltip', () => {
        render(
            <Explain label="Explain goal direction" description="Colors target status." />
        );

        expect(screen.getByLabelText('Explain goal direction')).toHaveAttribute(
            'aria-describedby'
        );
        expect(screen.getByRole('tooltip')).toHaveTextContent('Colors target status.');
    });
});
