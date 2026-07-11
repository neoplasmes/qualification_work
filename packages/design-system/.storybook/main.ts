import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/react-vite';

const workspaceRoot = fileURLToPath(new URL('../../../', import.meta.url));

const config = {
    stories: ['../src/**/*.stories.tsx'],
    framework: '@storybook/react-vite',
    addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
    core: { disableTelemetry: true },
    viteFinal: (config) => ({
        ...config,
        css: { ...config.css, transformer: 'postcss', postcss: workspaceRoot },
    }),
} satisfies StorybookConfig;

export default config;
