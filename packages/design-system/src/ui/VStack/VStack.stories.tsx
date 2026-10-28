import type { Meta, StoryObj } from '@storybook/react-vite';
import { gaps } from '@qualification-work/design-system';
import { Text } from '../Text';
import { VStack } from './index';

const meta = {
    title: 'Foundations/VStack',
    component: VStack,
    tags: ['autodocs'],
    args: {
        gap: 16,
        children: (
            <>
                <Text variant="heading-sm">Заголовок</Text>
                <Text>Содержимое / Content</Text>
                <Text tone="muted" variant="body-sm">
                    Подсказка
                </Text>
            </>
        ),
    },
    argTypes: { gap: { control: 'select', options: gaps } },
} satisfies Meta<typeof VStack>;

export default meta;
type Story = StoryObj<typeof meta>;

export const column: Story = {};
export const centered: Story = { args: { align: 'center', gap: 24 } };
