import type { Meta, StoryObj } from '@storybook/react-vite';
import { Textarea } from './index';

const meta = {
    title: 'Controls/Textarea',
    component: Textarea,
    tags: ['autodocs'],
    args: { 'aria-label': 'Комментарий', placeholder: 'Комментарий' },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const defaultState: Story = {};
export const disabled: Story = { args: { disabled: true } };
