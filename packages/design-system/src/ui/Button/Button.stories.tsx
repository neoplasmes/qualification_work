import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './index';

const meta = {
    title: 'Controls/Button',
    component: Button,
    tags: ['autodocs'],
    args: { children: 'Сохранить' },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const defaultState: Story = {};
export const disabled: Story = { args: { disabled: true } };
export const ghost: Story = { args: { variant: 'ghost' } };
export const danger: Story = { args: { variant: 'danger' } };
export const large: Story = { args: { size: 'large' } };
