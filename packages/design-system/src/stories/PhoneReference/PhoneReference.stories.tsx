import type { Meta, StoryObj } from '@storybook/react-vite';
import { PhoneReference } from './PhoneReference';

const meta = {
    title: 'Compositions/Phone',
    component: PhoneReference,
    parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof PhoneReference>;

export default meta;
type Story = StoryObj<typeof meta>;

export const reference: Story = {};
