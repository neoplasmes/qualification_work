import type { Meta, StoryObj } from '@storybook/react-vite';
import { Text } from '../Text';
import { Sheet } from './index';

const meta = { title: 'Controls/Sheet', component: Sheet, tags: ['autodocs'], args: { children: <Text>Бумажный лист</Text> } } satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const defaultState: Story = {};
