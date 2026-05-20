import { ArrowRight, Lock, Mail, User } from 'lucide-react';
import { useState } from 'react';

import {
    useLoginMutation,
    useRegisterMutation,
    useWaitForWorkspace,
} from '@/features/auth';
import { getApiErrorMessage } from '@/shared/api';

import styles from '../form.module.scss';

export const SignUp = () => {
    const [register, registerState] = useRegisterMutation();
    const [login, loginState] = useLoginMutation();
    const { waitForWorkspace, isPreparingWorkspace } = useWaitForWorkspace();
    const [error, setError] = useState('');
    const isBusy =
        registerState.isLoading || loginState.isLoading || isPreparingWorkspace;

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');

        const form = new FormData(event.currentTarget);
        const name = String(form.get('name') ?? '').trim();
        const family = String(form.get('family') ?? '').trim();
        const email = String(form.get('email') ?? '').trim();
        const password = String(form.get('password') ?? '');

        try {
            await register({ email, password, name, family }).unwrap();
            await login({ email, password }).unwrap();
            await waitForWorkspace();
        } catch (submitError) {
            setError(
                getApiErrorMessage(submitError, 'Unable to create account right now.')
            );
        }
    };

    return (
        <div data-stack="v" className={styles['form-container']}>
            <h2 className={styles['form-title']}>Join Us</h2>
            <p className={styles['form-subtitle']}>
                Create an account to start managing your data.
            </p>
            <form
                aria-label="Sign up"
                className={styles['form']}
                onSubmit={handleSubmit}
            >
                <div data-stack="v" data-gap="md">
                    <div data-stack="v" data-gap="sm" className={styles['field']}>
                        <label htmlFor="sign-up-name" className={styles['label']}>
                            First Name
                        </label>
                        <div
                            data-stack="h"
                            className={styles['input-wrapper']}
                            data-align="center"
                        >
                            <User size={18} />
                            <input
                                id="sign-up-name"
                                name="name"
                                className={styles['input']}
                                type="text"
                                autoComplete="given-name"
                                placeholder="Jane"
                                required
                                disabled={isBusy}
                            />
                        </div>
                    </div>
                    <div data-stack="v" data-gap="sm" className={styles['field']}>
                        <label htmlFor="sign-up-family" className={styles['label']}>
                            Last Name
                        </label>
                        <div
                            data-stack="h"
                            className={styles['input-wrapper']}
                            data-align="center"
                        >
                            <User size={18} />
                            <input
                                id="sign-up-family"
                                name="family"
                                className={styles['input']}
                                type="text"
                                autoComplete="family-name"
                                placeholder="Doe"
                                required
                                disabled={isBusy}
                            />
                        </div>
                    </div>
                    <div data-stack="v" data-gap="sm" className={styles['field']}>
                        <label htmlFor="sign-up-email" className={styles['label']}>
                            Email Address
                        </label>
                        <div
                            data-stack="h"
                            className={styles['input-wrapper']}
                            data-align="center"
                        >
                            <Mail size={18} />
                            <input
                                id="sign-up-email"
                                name="email"
                                type="email"
                                className={styles['input']}
                                autoComplete="email"
                                placeholder="name@organization.com"
                                required
                                disabled={isBusy}
                            />
                        </div>
                    </div>
                    <div data-stack="v" data-gap="sm" className={styles['field']}>
                        <label htmlFor="sign-up-password" className={styles['label']}>
                            Password
                        </label>
                        <div
                            data-stack="h"
                            className={styles['input-wrapper']}
                            data-align="center"
                        >
                            <Lock size={18} />
                            <input
                                id="sign-up-password"
                                name="password"
                                type="password"
                                className={styles['input']}
                                placeholder="••••••••"
                                autoComplete="new-password"
                                minLength={8}
                                required
                                disabled={isBusy}
                            />
                        </div>
                    </div>
                    {error && (
                        <p role="alert" className={styles['form-error']}>
                            {error}
                        </p>
                    )}
                    <button
                        type="submit"
                        data-stack="h"
                        data-gap="sm"
                        data-py="md"
                        data-justify="center"
                        data-align="center"
                        className={styles['submit-btn']}
                        disabled={isBusy}
                    >
                        {isPreparingWorkspace ? 'Preparing workspace' : 'Sign up'}
                        <ArrowRight size={18} />
                    </button>
                </div>
            </form>
        </div>
    );
};
