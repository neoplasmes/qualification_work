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

import styles from './signUp.page.module.css';

export const SignUp = () => {
    const { login, register, waitForWorkspace, isPreparingWorkspace, session, lifetime } =
        useAuthentication();
    const [error, setError] = useState('');
    const isBusy = register.isPending || login.isPending || isPreparingWorkspace;

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');

        const form = new FormData(event.currentTarget);
        const name = String(form.get('name') ?? '').trim();
        const family = String(form.get('family') ?? '').trim();
        const email = String(form.get('email') ?? '').trim();
        const password = String(form.get('password') ?? '');

        try {
            await register.execute({ email, password, name, family });
            if (!lifetime.active) {
                return;
            }
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
            setError(
                getApiErrorMessage(submitError, 'Unable to create account right now.')
            );
        }
    };

    return (
        <VStack gap={24} className={styles.page}>
            <VStack gap={12}>
                <Text as="h1" variant="heading">
                    Создать учётную запись
                </Text>
                <Text variant="body-sm" tone="muted">
                    Зарегистрируйтесь, чтобы начать работу с данными.
                </Text>
            </VStack>
            <form
                aria-label="Sign up"
                className={formStyles.form}
                onSubmit={handleSubmit}
            >
                <Field label="Имя">
                    <Input
                        id="sign-up-name"
                        name="name"
                        type="text"
                        autoComplete="given-name"
                        required
                        disabled={isBusy}
                    />
                </Field>
                <Field label="Фамилия">
                    <Input
                        id="sign-up-family"
                        name="family"
                        type="text"
                        autoComplete="family-name"
                        required
                        disabled={isBusy}
                    />
                </Field>
                <Field label="Электронная почта">
                    <Input
                        id="sign-up-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        disabled={isBusy}
                    />
                </Field>
                <Field label="Пароль">
                    <Input
                        id="sign-up-password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
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
                          : 'Зарегистрироваться'}
                </Button>
            </form>
        </VStack>
    );
};
