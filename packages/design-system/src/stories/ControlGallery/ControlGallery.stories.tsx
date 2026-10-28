import type { Meta, StoryObj } from '@storybook/react-vite';
import { ControlGallery } from './ControlGallery';

const meta = {
    title: 'Compositions/Gallery',
    component: ControlGallery,
    parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ControlGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const reference: Story = {};
