import type { Meta, StoryObj } from '@storybook/react-vite';
import { Choice } from './index';

const meta = {
    title: 'Controls/Choice',
    component: Choice,
    tags: ['autodocs'],
    args: {
        'aria-label': 'Канал',
        options: [
            { value: 'shop', label: 'Магазин' },
            { value: 'avito', label: 'Авито' },
            { value: 'site', label: 'Сайт' },
        ],
        defaultValue: 'shop',
    },
} satisfies Meta<typeof Choice>;

export default meta;
type Story = StoryObj<typeof meta>;

export const defaultState: Story = {};
export const disabled: Story = { args: { disabled: true } };
