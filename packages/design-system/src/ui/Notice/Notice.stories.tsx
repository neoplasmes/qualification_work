import type { Meta, StoryObj } from '@storybook/react-vite';
import { Notice } from './index';

const meta = {
    title: 'Controls/Notice',
    component: Notice,
    tags: ['autodocs'],
    args: { children: 'Не хватает товара на складе' },
} satisfies Meta<typeof Notice>;

export default meta;
type Story = StoryObj<typeof meta>;

export const defaultState: Story = {};
