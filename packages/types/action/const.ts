export const actionParameterTypes = [
    'string',
    'number',
    'date',
    'bool',
    'day_of_week',
] as const;

export const actionRunStatuses = ['success', 'failed'] as const;

export const actionEffectKinds = ['insertRow', 'updateRowsByMatch'] as const;

export const actionValueSourceKinds = ['parameter', 'literal', 'computed'] as const;

export const actionValueOperations = ['=', '+', '-', '*', '/'] as const;

export const actionComputedOperations = ['+', '-', '*', '/'] as const;
