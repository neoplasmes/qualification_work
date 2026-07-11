import type { Meta, StoryObj } from '@storybook/react-vite';
import { Radio } from './index';

const meta = { title: 'Controls/Radio', component: Radio, tags: ['autodocs'], args: { 'aria-label': 'Основной вариант', defaultChecked: true, name: 'radio' } } satisfies Meta<typeof Radio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const defaultState: Story = {};
export const disabled: Story = { args: { disabled: true } };
