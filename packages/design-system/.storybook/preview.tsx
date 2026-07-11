import type { Preview } from '@storybook/react-vite';
import './storybook.css';

const preview: Preview = {
    decorators: [(Story) => <div data-theme="paper"><Story /></div>],
    parameters: {
        layout: 'padded',
        controls: { expanded: true },
        a11y: { test: 'todo' },
    },
};

export default preview;
