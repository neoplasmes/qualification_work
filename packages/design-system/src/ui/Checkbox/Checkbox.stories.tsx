import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from './index';

const meta = { title: 'Controls/Checkbox', component: Checkbox, tags: ['autodocs'], args: { 'aria-label': 'Уведомления', defaultChecked: true } } satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const defaultState: Story = {};
export const disabled: Story = { args: { disabled: true } };
