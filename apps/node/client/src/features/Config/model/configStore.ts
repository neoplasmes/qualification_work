import type {
    ConfigBind,
    ConfigMutator,
    ConfigSetter,
    ConfigSnapshot,
    ConfigToOutput,
    DisabledOutputRule,
} from './types';

type ConfigStoreOptions<T extends object, O> = {
    onChange?: (draft: T) => void;
    onOutputChange?: (output: O) => void;
    configToOutput?: ConfigToOutput<T, O>;
};

function resolveNext<T>(current: T, next: ConfigSetter<T>) {
    return typeof next === 'function' ? (next as (current: T) => T)(current) : next;
}

export class ConfigStore<T extends object, O> {
    private readonly listeners = new Set<() => void>();

    private readonly disabledSectionOutputRules = new Map<
        string,
        DisabledOutputRule<T>
    >();

    /**
     * draft is the very config that is configured in this store
     *
     * @private
     */
    private draft: T;

    /**
     * config modification that will be sent outside of the store
     *
     * @private
     */
    private output: O;

    private snapshot: ConfigSnapshot<T, O>;
    private options: ConfigStoreOptions<T, O> = {};

    constructor(initialDraft: T) {
        this.draft = initialDraft;
        this.output = initialDraft as unknown as O;
        this.snapshot = this.createSnapshot();
    }

    setOptions(options: ConfigStoreOptions<T, O>) {
        this.options = options;
    }

    // ————————————————————— store subscriptions —————————————————————
    subscribe(listener: () => void) {
        const listeners = this.listeners;

        this.listeners.add(listener);

        return function unsubscribe() {
            listeners.delete(listener);
        };
    }

    private notifySubscribers() {
        for (const listener of this.listeners) {
            listener();
        }
    }

    // ————————————————————— Draft (actual config) managment —————————————————————

    getDraft() {
        return this.draft;
    }

    setDraft(next: ConfigSetter<T>) {
        this.commitDraft(resolveNext(this.draft, next), true);
    }

    mutateDraft(mutator: ConfigMutator<T>) {
        const nextDraft = structuredClone(this.draft);

        mutator(nextDraft);
        this.commitDraft(nextDraft, true);
    }

    replaceDraft(next: T) {
        this.commitDraft(next, false);
    }

    private commitDraft(next: T, shouldNotifyChange: boolean) {
        if (Object.is(this.draft, next)) {
            return;
        }

        this.draft = next;
        this.rebuildSnapshot();
        this.notifySubscribers();

        if (shouldNotifyChange) {
            this.options.onChange?.(this.draft);
        }

        this.notifyOutputChange();
    }

    getValue<V>(bind: ConfigBind<T, V>) {
        return bind.get(this.draft);
    }

    setValue<V>(bind: ConfigBind<T, V>, next: ConfigSetter<V>) {
        const nextDraft = structuredClone(this.draft);
        const currentValue = bind.get(nextDraft);

        bind.set(nextDraft, resolveNext(currentValue, next));
        this.commitDraft(nextDraft, true);
    }

    // ————————————————————— Output managment —————————————————————
    refreshOutput() {
        this.rebuildSnapshot();
        this.notifySubscribers();
        this.notifyOutputChange();
    }

    private notifyOutputChange() {
        this.options.onOutputChange?.(this.output);
    }

    addDisabledSectionOutputRule(rule: DisabledOutputRule<T>) {
        this.disabledSectionOutputRules.set(rule.id, rule);
        this.refreshOutput();
    }

    removeDisabledSectionOutputRule(rule: DisabledOutputRule<T>) {
        if (this.disabledSectionOutputRules.delete(rule.id)) {
            this.refreshOutput();
        }
    }

    getSnapshot() {
        return this.snapshot;
    }

    private createSnapshot(): ConfigSnapshot<T, O> {
        return {
            draft: this.draft,
            output: this.output,
            setDraft: this.setDraft,
            mutateDraft: this.mutateDraft,
            getValue: this.getValue,
            setValue: this.setValue,
        };
    }

    private rebuildSnapshot() {
        let normalizedDraft = this.draft;

        for (const rule of this.disabledSectionOutputRules.values()) {
            if (rule.enabled) {
                continue;
            }

            if (normalizedDraft === this.draft) {
                normalizedDraft = structuredClone(this.draft);
            }

            rule.apply(normalizedDraft);
        }

        this.output = this.options.configToOutput
            ? this.options.configToOutput(normalizedDraft, this.draft)
            : (normalizedDraft as unknown as O);
        this.snapshot = this.createSnapshot();
    }
}
