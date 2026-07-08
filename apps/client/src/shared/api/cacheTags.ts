const datasetRelationPrefix = 'dataset:';
const chartRelationPrefix = 'chart:';

export const datasetRelationTagId = (datasetId: string) =>
    `${datasetRelationPrefix}${datasetId}`;

export const chartRelationTagId = (chartId: string) => `${chartRelationPrefix}${chartId}`;
