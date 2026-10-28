import type { Meta, StoryObj } from '@storybook/react-vite';
import { Foundation } from './Foundation';

const meta = {
    title: 'Foundations/Theme',
    component: Foundation,
    tags: ['autodocs'],
} satisfies Meta<typeof Foundation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const paletteTypeAndSpacing: Story = {};
