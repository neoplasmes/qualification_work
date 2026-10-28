import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stamp } from './index';

const meta = {
    title: 'Controls/Stamp',
    component: Stamp,
    tags: ['autodocs'],
    args: { children: 'Выполнено' },
} satisfies Meta<typeof Stamp>;

export default meta;
type Story = StoryObj<typeof meta>;

export const defaultState: Story = {};
export const draft: Story = { args: { variant: 'draft' } };
export const voidState: Story = { args: { variant: 'void' } };
