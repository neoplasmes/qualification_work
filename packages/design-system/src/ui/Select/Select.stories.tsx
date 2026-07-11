import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select } from './index';

const meta = { title: 'Controls/Select', component: Select, tags: ['autodocs'], args: { 'aria-label': 'Таблица', children: <><option>Склад</option><option>Продажи</option></> } } satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const defaultState: Story = {};
export const disabled: Story = { args: { disabled: true } };
