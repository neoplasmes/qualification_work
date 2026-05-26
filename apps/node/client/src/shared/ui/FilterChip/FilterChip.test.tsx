import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FilterChip } from './FilterChip';

describe('FilterChip', () => {
    it('renders selected chip with metadata', () => {
        render(<FilterChip selected label="Revenue" meta={<span>12 rows</span>} />);

        expect(screen.getByRole('button', { name: /Revenue/ })).toHaveAttribute(
            'aria-pressed',
            'true'
        );
        expect(screen.getByText('12 rows')).toBeInTheDocument();
    });
});
