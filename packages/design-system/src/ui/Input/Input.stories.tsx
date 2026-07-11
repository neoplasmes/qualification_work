import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from './index';

const meta = { title: 'Controls/Input', component: Input, tags: ['autodocs'], args: { 'aria-label': 'Номер заказа', defaultValue: 'З-1042' } } satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const defaultState: Story = {};
export const disabled: Story = { args: { disabled: true } };
