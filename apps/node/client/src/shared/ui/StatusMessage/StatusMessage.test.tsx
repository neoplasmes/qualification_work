import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StatusMessage } from './StatusMessage';

describe('StatusMessage', () => {
    it('uses alert role for errors', () => {
        render(<StatusMessage tone="error">Something failed</StatusMessage>);

        expect(screen.getByRole('alert')).toHaveTextContent('Something failed');
    });
});
