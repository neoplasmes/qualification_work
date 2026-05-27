export const isDatasetFile = (file: File) => {
    const lowerName = file.name.toLowerCase();

    return lowerName.endsWith('.csv') || lowerName.endsWith('.xlsx');
};

export const getFileKey = (file: File) =>
    `${file.name}-${file.size}-${file.lastModified}`;

export const getUniqueFiles = (current: File[], incoming: File[]) => {
    const existingKeys = new Set(current.map(getFileKey));

    return incoming.filter(file => !existingKeys.has(getFileKey(file)));
};

export const getDatasetName = (filename: string) =>
    filename.replace(/\.[^/.]+$/, '') || 'dataset';
