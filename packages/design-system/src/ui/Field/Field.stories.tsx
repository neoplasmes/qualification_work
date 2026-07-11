import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from '../Input';
import { Field } from './index';

const meta = { title: 'Controls/Field', component: Field, tags: ['autodocs'], args: { label: 'Номер заказа', description: 'Значение из таблицы', children: <Input defaultValue="З-1042" /> } } satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const defaultState: Story = {};
export const error: Story = { args: { error: 'Укажите номер заказа' } };
