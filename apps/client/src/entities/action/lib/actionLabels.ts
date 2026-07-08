import type { Action } from '../api';

export const getEffectLabel = (kind: Action['effects'][number]['kind']) =>
    kind === 'insertRow' ? 'Insert row' : 'Update by match';
