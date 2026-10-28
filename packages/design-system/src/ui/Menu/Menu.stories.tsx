import type { Meta, StoryObj } from '@storybook/react-vite';
import { Menu } from './index';

const meta = {
    title: 'Controls/Menu',
    component: Menu,
    tags: ['autodocs'],
    args: {
        trigger: 'Действия',
        items: [
            { id: 'receive', label: 'Принять поставку', href: '#receive' },
            { id: 'create', label: 'Новое действие', separatorBefore: true, quiet: true },
        ],
    },
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const defaultState: Story = {};
export const open: Story = { args: { defaultOpen: true } };
