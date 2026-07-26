let draftCounter = 0;

export const createActionBuilderDraftId = () => {
    draftCounter += 1;

    return `draft-${draftCounter}`;
};
