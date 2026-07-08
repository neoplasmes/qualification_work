export default {
    extends: ['stylelint-config-standard-scss'],
    rules: {
        'declaration-empty-line-before': null,
        'selector-pseudo-class-no-unknown': [
            true,
            {
                ignorePseudoClasses: ['global'],
            },
        ],
    },
};
