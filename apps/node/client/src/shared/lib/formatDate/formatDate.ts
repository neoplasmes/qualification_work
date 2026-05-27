const formatter = new Intl.DateTimeFormat('en', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
});

export const formatDate = (value: string) => formatter.format(new Date(value));
