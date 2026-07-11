import type { Meta, StoryObj } from '@storybook/react-vite';
import { gaps } from '@qualification-work/design-system';
import { Text } from '../Text';
import { HStack } from './index';

const meta = {
    title: 'Foundations/HStack',
    component: HStack,
    tags: ['autodocs'],
    args: { gap: 16, children: <><Text>Бумага</Text><Text>Чернила</Text><Text>Paper and ink</Text></> },
    argTypes: { gap: { control: 'select', options: gaps } },
} satisfies Meta<typeof HStack>;

export default meta;
type Story = StoryObj<typeof meta>;

export const row: Story = {};
export const wrapping: Story = { args: { wrap: true, gap: 32 } };
export const spread: Story = { args: { justify: 'space-between', fullWidth: true } };
