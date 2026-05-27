import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SegmentedTabs } from './SegmentedTabs';

describe('SegmentedTabs', () => {
    it('renders active option, active marker and calls onChange', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();

        render(
            <SegmentedTabs
                value="one"
                options={[
                    { value: 'one', label: 'One', count: 2, testId: 'tab-one' },
                    { value: 'two', label: 'Two', testId: 'tab-two' },
                ]}
                onChange={onChange}
            />
        );

        expect(screen.getByRole('button', { name: /One/ })).toHaveAttribute(
            'aria-pressed',
            'true'
        );
        expect(screen.queryByText('2')).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Two' }));

        expect(onChange).toHaveBeenCalledWith('two');
    });
});
