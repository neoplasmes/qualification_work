import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Switch } from './Switch';

describe('Switch', () => {
    it('renders as an accessible switch and calls onChange', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();

        render(<Switch aria-label="Enable filters" onChange={onChange} />);

        await user.click(screen.getByRole('switch', { name: 'Enable filters' }));

        expect(onChange).toHaveBeenCalledTimes(1);
    });
});
