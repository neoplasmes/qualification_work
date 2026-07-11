import type { Meta, StoryObj } from '@storybook/react-vite';
import { ValueDiff } from './index';

const meta = { title: 'Controls/ValueDiff', component: ValueDiff, tags: ['autodocs'], args: { before: 14, after: 12, changeLabel: 'станет' } } satisfies Meta<typeof ValueDiff>;

export default meta;
type Story = StoryObj<typeof meta>;

export const defaultState: Story = {};
