import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TextInput } from '../TextInput';
import { FormField } from './FormField';

describe('FormField', () => {
    it('renders label, hint and error with invalid input', () => {
        render(
            <FormField label="Name" hint="Visible to teammates" error="Required">
                <TextInput invalid />
            </FormField>
        );

        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Visible to teammates')).toBeInTheDocument();
        expect(screen.getByText('Required')).toBeInTheDocument();
        expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });
});
