import type { Meta, StoryObj } from '@storybook/react-vite';
import { Marker } from './index';

const meta = {
    title: 'Controls/Marker',
    component: Marker,
    tags: ['autodocs'],
    args: { children: '+1 строка' },
} satisfies Meta<typeof Marker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const defaultState: Story = {};
