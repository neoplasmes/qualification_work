import type { Meta, StoryObj } from '@storybook/react-vite';
import { HStack } from '../HStack';
import { Stat } from './index';

const meta = {
    title: 'Controls/Stat',
    component: Stat,
    tags: ['autodocs'],
    args: { label: 'Выручка', value: '1 240 000 ₽' },
    parameters: {
        docs: {
            description: {
                component:
                    'Показатель без рамки: подпись, значение и необязательное сравнение. Текст сравнения передаёт вызывающий код. Знак числа не определяет цвет: deltaTone="danger" явно отмечает неблагоприятное изменение.',
            },
        },
    },
} satisfies Meta<typeof Stat>;

export default meta;
type Story = StoryObj<typeof meta>;

export const valueOnly: Story = {};
export const positiveDelta: Story = { args: { delta: '+12% к прошлому месяцу' } };
export const negativeDelta: Story = {
    args: { label: 'Возвраты', value: '18', delta: '−8% к прошлому месяцу' },
};
export const increasedExpense: Story = {
    args: {
        label: 'Расходы',
        value: '420 000 ₽',
        delta: '+15% к прошлому месяцу',
        deltaTone: 'danger',
    },
};
export const fourMetrics: Story = {
    render: () => (
        <HStack gap={64} align="start" wrap>
            <Stat label="Выручка" value="1 240 000 ₽" delta="+12% к прошлому месяцу" />
            <Stat label="Заказы" value="384" delta="+24 к прошлому месяцу" />
            <Stat label="Возвраты" value="18" delta="−8% к прошлому месяцу" />
            <Stat
                label="Расходы"
                value="420 000 ₽"
                delta="+15% к прошлому месяцу"
                deltaTone="danger"
            />
        </HStack>
    ),
    parameters: {
        docs: {
            description: {
                story: 'До четырёх показателей в строке. На узком экране показатели переносятся, длинные значения и сравнения остаются читаемыми.',
            },
        },
    },
};
