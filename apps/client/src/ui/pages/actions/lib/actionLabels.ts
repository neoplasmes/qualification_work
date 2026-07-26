import type { Action } from '@/core/entities/action';

export const getEffectLabel = (kind: Action['effects'][number]['kind']) =>
    kind === 'insertRow' ? 'Добавить строку' : 'Изменить по условию';
