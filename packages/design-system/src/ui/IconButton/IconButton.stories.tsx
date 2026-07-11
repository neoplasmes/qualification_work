import type { Meta, StoryObj } from '@storybook/react-vite';
import { Trash2 } from 'lucide-react';
import { IconButton } from './index';

const meta = { title: 'Controls/IconButton', component: IconButton, tags: ['autodocs'], args: { children: <Trash2 size={18} />, 'aria-label': 'Удалить' } } satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const defaultState: Story = {};
export const disabled: Story = { args: { disabled: true } };
