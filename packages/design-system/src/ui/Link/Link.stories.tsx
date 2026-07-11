import type { Meta, StoryObj } from '@storybook/react-vite';
import { Link } from './index';

const meta = { title: 'Controls/Link', component: Link, tags: ['autodocs'], args: { href: '#journal', children: 'Журнал' } } satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof meta>;

export const defaultState: Story = {};
