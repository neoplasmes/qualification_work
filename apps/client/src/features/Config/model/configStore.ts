import type { ConfigBind, ConfigMutator, ConfigSetter, ConfigSnapshot } from './types';

type ConfigStoreOptions<T extends object> = {
    onChange?: (draft: T) => void;
};

function resolveNext<T>(current: T, next: ConfigSetter<T>) {
    return typeof next === 'function' ? (next as (current: T) => T)(current) : next;
}

export class ConfigStore<T extends object> {
    private readonly listeners = new Set<() => void>();

    /**
     * draft is the very config that is configured in this store
     *
     * @private
     */
    private draft: T;

    private snapshot: ConfigSnapshot<T>;
    private options: ConfigStoreOptions<T> = {};

    constructor(initialDraft: T) {
        this.draft = initialDraft;
        this.snapshot = this.createSnapshot();
    }

    setOptions(options: ConfigStoreOptions<T>) {
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
    }

    getValue<V>(bind: ConfigBind<T, V>) {
        return bind.get(this.draft);
    }

    setValue<V>(bind: ConfigBind<T, V>, next: ConfigSetter<V>) {
        const nextDraft = structuredClone(this.draft);
        const nextValue =
            typeof next === 'function' ? resolveNext(bind.get(nextDraft), next) : next;

        bind.set(nextDraft, nextValue);
        this.commitDraft(nextDraft, true);
    }

    getField<K extends keyof T & string>(field: K) {
        return this.draft[field];
    }

    setField<K extends keyof T & string>(field: K, next: ConfigSetter<T[K]>) {
        const nextDraft = structuredClone(this.draft);
        const nextValue =
            typeof next === 'function' ? resolveNext(nextDraft[field], next) : next;

        nextDraft[field] = nextValue;
        this.commitDraft(nextDraft, true);
    }

    getSnapshot() {
        return this.snapshot;
    }

    private createSnapshot(): ConfigSnapshot<T> {
        return {
            draft: this.draft,
            setDraft: this.setDraft.bind(this),
            mutateDraft: this.mutateDraft.bind(this),
            getValue: this.getValue.bind(this),
            setValue: this.setValue.bind(this),
        };
    }

    private rebuildSnapshot() {
        this.snapshot = this.createSnapshot();
    }
}
