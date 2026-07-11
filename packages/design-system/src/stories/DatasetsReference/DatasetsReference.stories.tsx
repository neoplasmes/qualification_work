import type { Meta, StoryObj } from '@storybook/react-vite';
import { DatasetsReference } from './DatasetsReference';

const meta = { title: 'Compositions/Datasets', component: DatasetsReference, parameters: { layout: 'fullscreen' } } satisfies Meta<typeof DatasetsReference>;

export default meta;
type Story = StoryObj<typeof meta>;

export const reference: Story = {};
