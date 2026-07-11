import type { Meta, StoryObj } from '@storybook/react-vite';
import { Text } from './index';

const meta = {
    title: 'Foundations/Text',
    component: Text,
    tags: ['autodocs'],
    args: { children: 'Продажи · Paper and ink · 0123456789', variant: 'body' },
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

export const body: Story = {};
export const bodySm: Story = { args: { variant: 'body-sm', tone: 'muted' } };
export const label: Story = { args: { variant: 'label' } };
export const typed: Story = { args: { variant: 'typed', tabular: true } };
export const headingSm: Story = { args: { as: 'h2', variant: 'heading-sm' } };
export const heading: Story = { args: { as: 'h1', variant: 'heading' } };
export const display: Story = { args: { variant: 'display' } };
export const lead: Story = { args: { as: 'p', variant: 'lead' } };

export const headingLg: Story = { args: { variant: 'heading-lg', children: '12 480' } };
export const data: Story = { args: { variant: 'data', children: '2 464' } };
export const caption: Story = { args: { variant: 'caption', children: 'Лист 2 из 3' } };
export const ui: Story = { args: { variant: 'ui', children: 'Сохранить' } };
