import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
    it('renders tooltip content', () => {
        render(<Tooltip>Full title</Tooltip>);

        expect(screen.getByRole('tooltip')).toHaveTextContent('Full title');
    });
});
