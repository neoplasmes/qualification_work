import path from 'node:path';
import { defineConfig } from 'vitest/config';

import { createVitestConfig } from '@qualification-work/microservice-config/vitest';

export default defineConfig(createVitestConfig(path.resolve(import.meta.dirname, 'src')));
