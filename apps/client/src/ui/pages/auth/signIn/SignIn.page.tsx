import { useAuthentication } from '@/ui/session';
import { entranceFormStyles as formStyles } from '@/ui/widgets/EntranceLayout';
import {
    Button,
    Field,
    Input,
    Notice,
    Text,
    VStack,
} from '@qualification-work/design-system';
import { useState } from 'react';

import { getApiErrorMessage } from '@/shared/api';

import styles from './signIn.page.module.css';

export const SignIn = () => {
    const { login, waitForWorkspace, isPreparingWorkspace, session, lifetime } =
        useAuthentication();
    const [error, setError] = useState('');
    const isBusy = login.isPending || isPreparingWorkspace;

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');

        const form = new FormData(event.currentTarget);
        const email = String(form.get('email') ?? '').trim();
        const password = String(form.get('password') ?? '');

        try {
            await session.reset();
            if (!lifetime.active) {
                return;
            }
            await login.execute({ email, password });
            await waitForWorkspace();
        } catch (submitError) {
            if (!lifetime.active) {
                return;
            }
            setError(getApiErrorMessage(submitError, 'Unable to sign in right now.'));
        }
    };

    return (
        <VStack gap={24} className={styles.page}>
            <VStack gap={12}>
                <Text as="h1" variant="heading">
                    Войти в рабочую тетрадь
                </Text>
                <Text variant="body-sm" tone="muted">
                    Таблицы, графики и действия вашей организации.
                </Text>
            </VStack>
            <form
                aria-label="Sign in"
                className={formStyles.form}
                onSubmit={handleSubmit}
            >
                <Field label="Электронная почта">
                    <Input
                        id="sign-in-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        disabled={isBusy}
                    />
                </Field>
                <Field label="Пароль">
                    <Input
                        id="sign-in-password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        disabled={isBusy}
                        minLength={8}
                    />
                </Field>

                {error && (
                    <Notice tone="danger" role="alert">
                        {error}
                    </Notice>
                )}
                <Button
                    type="submit"
                    size="large"
                    fullWidth
                    disabled={isBusy}
                    aria-busy={isBusy}
                >
                    {isPreparingWorkspace
                        ? 'Подготовка рабочего пространства…'
                        : isBusy
                          ? 'Пожалуйста, подождите…'
                          : 'Войти'}
                </Button>
            </form>
        </VStack>
    );
};
