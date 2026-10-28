import type { Meta, StoryObj } from '@storybook/react-vite';
import { Token } from './index';
import { SentenceExample } from './ui';

const meta = {
    title: 'Controls/Token',
    component: Token,
    tags: ['autodocs'],
    args: { children: 'Выручка' },
    parameters: {
        docs: {
            description: {
                component:
                    'Кнопка для значения, поля или добавления части выражения. Меню и выбранное значение управляются снаружи.',
            },
        },
    },
} satisfies Meta<typeof Token>;

export default meta;
type Story = StoryObj<typeof meta>;

export const defaultValue: Story = {};
export const field: Story = { args: { variant: 'field', children: 'Канал продаж' } };
export const add: Story = { args: { variant: 'add', children: '+ добавить условие' } };
export const disabled: Story = { args: { disabled: true } };
export const sentence: Story = {
    render: () => <SentenceExample />,
    parameters: {
        docs: {
            description: {
                story: 'Откройте список клавишами Enter, Пробел или стрелкой вниз. Выберите показатель стрелками и Enter. Escape закрывает меню и возвращает фокус к Token.',
            },
        },
    },
};
