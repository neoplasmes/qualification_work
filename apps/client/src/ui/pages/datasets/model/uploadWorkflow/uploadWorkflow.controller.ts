import { useCommand } from '@/env/cache/useCommand';
import { useDependencies } from '@/ui/di/dependencies';
import { useCallback, useEffect, useRef, useState } from 'react';

import type {
    MergeInput,
    MergePreviewResult,
    MergeSessionInput,
} from '@/app/ports/repos/upload';

type PreviewInput = Omit<MergeInput, 'files'> & { files: File[] };
type UploadInput = { orgId: string; files: File[]; single: boolean; name: string };

export function useUploadWorkflow(
    onSuccess: (id: string) => Promise<void>,
    onClose: () => void
) {
    const dependencies = useDependencies();
    const upload = useCommand(dependencies.uploadDataset);
    const preview = useCommand(dependencies.previewDatasetMerge);
    const commit = useCommand(dependencies.commitDatasetMerge);
    const cancel = useCommand(dependencies.cancelDatasetMerge).execute;
    const alive = useRef(true);
    const pending = useRef(false);
    const committing = useRef(false);
    const session = useRef<MergeSessionInput | null>(null);
    const saved = useRef<{ orgId: string; datasetId: string } | null>(null);
    const locked = useRef(false);
    const uncertain = useRef(false);

    const [busy, setBusy] = useState(false);
    const [blocked, setBlocked] = useState(false);
    const [error, setError] = useState('');
    const [syncWarning, setSyncWarning] = useState(false);
    const [progress, setProgress] = useState('');
    const [previewResult, setPreviewResult] = useState<MergePreviewResult | null>(null);

    const cleanup = useCallback(async () => {
        const scope = session.current;
        if (!scope || committing.current) {
            return;
        }
        session.current = null;
        try {
            await cancel(scope);
        } catch {
            if (alive.current) {
                setError(
                    current =>
                        current ||
                        'Не удалось закрыть проверку. Закройте окно; временные данные удалятся после истечения срока проверки.'
                );
            }
        }
    }, [cancel]);
    useEffect(() => {
        alive.current = true;

        return () => {
            alive.current = false;
            void cleanup();
        };
    }, [cleanup]);

    const refresh = async (warning = false) => {
        const scope = saved.current;
        if (!scope || !alive.current) {
            return;
        }
        try {
            await dependencies.cache.read(dependencies.getDatasetMetadata, scope);
            if (!alive.current) {
                return;
            }
            await onSuccess(scope.datasetId);
            if (!alive.current) {
                return;
            }
            if (warning) {
                setSyncWarning(true);
            } else {
                setSyncWarning(false);
                onClose();
            }
        } catch {
            if (alive.current) {
                setSyncWarning(true);
            }
        }
    };

    const fail = (failure: unknown, write: boolean) => {
        const value = failure as {
            name?: string;
            message?: string;
            payload?: { message?: string; error?: string };
        };
        const unknownOutcome =
            value.name === 'UncertainCommandError' ||
            value.name === 'ContractViolationError';
        if (unknownOutcome && write) {
            uncertain.current = true;
            session.current = null;
        }
        if (!alive.current) {
            return;
        }
        if (write) {
            locked.current = true;
            setBlocked(true);
        }
        const message =
            value.payload?.message ||
            value.payload?.error ||
            value.message ||
            'Не удалось выполнить операцию';
        setError(
            unknownOutcome
                ? 'Результат отправки неизвестен. Закройте окно и обновите таблицы, прежде чем снова отправлять файлы.'
                : `${message}. ${write && !previewResult ? 'Закройте окно и проверьте список таблиц перед повторной загрузкой.' : 'Вернитесь к настройкам и повторите проверку файлов.'}`
        );
    };

    const requestPreview = async (input: PreviewInput) => {
        if (pending.current || locked.current || !alive.current) {
            return;
        }
        pending.current = true;
        setBusy(true);
        setError('');
        const handles = dependencies.uploads.register(input.files);
        try {
            const result = await preview.execute({ ...input, files: handles });
            session.current = { orgId: input.orgId, sessionId: result.sessionId };
            if (!alive.current) {
                await cleanup();

                return;
            }
            setPreviewResult(result);
        } catch (failure) {
            fail(failure, false);
        } finally {
            dependencies.uploads.release(handles);
            pending.current = false;
            if (alive.current) {
                setBusy(false);
            }
        }
    };

    const confirm = async () => {
        const scope = session.current;
        if (!scope || pending.current || locked.current || !alive.current) {
            return;
        }
        pending.current = true;
        committing.current = true;
        setBusy(true);
        setError('');
        try {
            const result = await commit.executeOutcome(scope);
            session.current = null;
            saved.current = { orgId: scope.orgId, datasetId: result.data.datasetId };
            locked.current = true;
            if (alive.current) {
                setBlocked(true);
            }
            await refresh(Boolean(result.syncError));
        } catch (failure) {
            fail(failure, true);
        } finally {
            committing.current = false;
            pending.current = false;
            if (!alive.current) {
                await cleanup();
            } else {
                setBusy(false);
            }
        }
    };

    const submit = async (input: UploadInput) => {
        if (pending.current || locked.current || !alive.current || !input.files.length) {
            return;
        }
        pending.current = true;
        setBusy(true);
        setError('');
        const handles = dependencies.uploads.register(input.files);
        let writeStarted = false;
        let warning = false;
        try {
            if (input.single) {
                setProgress('Проверяем структуру файлов…');
                const result = await preview.execute({
                    orgId: input.orgId,
                    name: input.name,
                    mode: 'append',
                    createNew: true,
                    mergeKeys: [],
                    files: handles,
                });
                session.current = { orgId: input.orgId, sessionId: result.sessionId };
                if (!alive.current) {
                    await cleanup();

                    return;
                }
                setProgress('Создаём таблицу…');
                writeStarted = true;
                committing.current = true;
                const outcome = await commit.executeOutcome(session.current);
                session.current = null;
                saved.current = { orgId: input.orgId, datasetId: outcome.data.datasetId };
                warning = Boolean(outcome.syncError);
            } else {
                for (const [index, file] of handles.entries()) {
                    if (!alive.current) {
                        break;
                    }
                    setProgress(
                        `Загружаем ${index + 1} из ${handles.length}: ${file.name}`
                    );
                    writeStarted = true;
                    const outcome = await upload.executeOutcome({
                        orgId: input.orgId,
                        file,
                    });
                    saved.current = { orgId: input.orgId, datasetId: outcome.data.id };
                    warning ||= Boolean(outcome.syncError);
                    try {
                        await dependencies.cache.read(
                            dependencies.getDatasetMetadata,
                            saved.current
                        );
                    } catch {
                        warning = true;
                    }
                }
            }
            locked.current = true;
            if (alive.current) {
                setBlocked(true);
            }
            await refresh(warning);
        } catch (failure) {
            fail(failure, writeStarted);
            committing.current = false;
            await cleanup();
        } finally {
            committing.current = false;
            dependencies.uploads.release(handles);
            pending.current = false;
            if (alive.current) {
                setBusy(false);
                setProgress('');
            }
        }
    };

    const back = async () => {
        if (pending.current || saved.current || uncertain.current) {
            return;
        }
        await cleanup();
        if (!alive.current) {
            return;
        }
        locked.current = false;
        setBlocked(false);
        setPreviewResult(null);
    };
    const close = () => {
        alive.current = false;
        void cleanup();
        onClose();
    };

    return {
        requestPreview,
        confirm,
        submit,
        back,
        close,
        refresh,
        error,
        busy,
        blocked,
        backDisabled: busy || uncertain.current || Boolean(saved.current),
        progress,
        syncWarning,
        previewResult,
    };
}
