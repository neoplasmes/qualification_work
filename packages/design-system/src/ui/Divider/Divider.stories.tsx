import type { Meta, StoryObj } from '@storybook/react-vite';
import { Divider } from './index';

const meta = {
    title: 'Controls/Divider',
    component: Divider,
    tags: ['autodocs'],
    args: {},
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const defaultState: Story = {};
