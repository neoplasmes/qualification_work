import { createConfig, type ConfigBind } from '@/shared/ui/tools/Config';

export type MergeDatasetMode = 'append' | 'merge';

export type MergeDatasetDraft = {
    mode: MergeDatasetMode;
    createNew: boolean;
    newDatasetName: string;
    selectedMergeKeys: string[];
    files: File[];
};

export const defaultMergeDatasetDraft: MergeDatasetDraft = {
    mode: 'append',
    createNew: false,
    newDatasetName: '',
    selectedMergeKeys: [],
    files: [],
};

export const mergeDatasetConfig = createConfig<MergeDatasetDraft>();

export const mergeDatasetModeBind = {
    get: draft => draft.mode,
    set: (draft, mode) => {
        draft.mode = mode;
    },
} satisfies ConfigBind<MergeDatasetDraft, MergeDatasetMode>;

export const mergeDatasetFilesBind = {
    get: draft => draft.files,
    set: (draft, files) => {
        draft.files = files;
    },
} satisfies ConfigBind<MergeDatasetDraft, File[]>;

export const mergeDatasetKeysBind = {
    get: draft => draft.selectedMergeKeys,
    set: (draft, selectedMergeKeys) => {
        draft.selectedMergeKeys = selectedMergeKeys;
    },
} satisfies ConfigBind<MergeDatasetDraft, string[]>;
