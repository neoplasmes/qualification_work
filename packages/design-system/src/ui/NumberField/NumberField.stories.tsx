import type { Meta, StoryObj } from '@storybook/react-vite';
import { NumberField } from './index';

const meta = {
    title: 'Controls/NumberField',
    component: NumberField,
    tags: ['autodocs'],
    args: { 'aria-label': 'Количество', min: 1, max: 14, defaultValue: 2 },
} satisfies Meta<typeof NumberField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const defaultState: Story = {};
export const disabled: Story = { args: { disabled: true } };
