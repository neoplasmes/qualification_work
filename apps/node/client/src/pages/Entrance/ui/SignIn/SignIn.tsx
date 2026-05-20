import { ArrowRight, Lock, Mail } from 'lucide-react';
import { useState } from 'react';

import { useLoginMutation, useWaitForWorkspace } from '@/features/auth';
import { getApiErrorMessage } from '@/shared/api';

import formStyles from '../form.module.scss';
import signInStyles from './SignIn.module.scss';

const styles = { ...formStyles, ...signInStyles };

export const SignIn = () => {
    const [login, loginState] = useLoginMutation();
    const { waitForWorkspace, isPreparingWorkspace } = useWaitForWorkspace();
    const [error, setError] = useState('');
    const isBusy = loginState.isLoading || isPreparingWorkspace;

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');

        const form = new FormData(event.currentTarget);
        const email = String(form.get('email') ?? '').trim();
        const password = String(form.get('password') ?? '');

        try {
            await login({ email, password }).unwrap();
            await waitForWorkspace();
        } catch (submitError) {
            setError(getApiErrorMessage(submitError, 'Unable to sign in right now.'));
        }
    };

    return (
        <div data-stack="v" className={styles['form-container']}>
            <h2 className={styles['form-title']}>Welcome Back</h2>
            <p className={styles['form-subtitle']}>
                Enter your credentials to access the analytics.
            </p>

            <form
                aria-label="Sign in"
                className={styles['form']}
                onSubmit={handleSubmit}
            >
                <div data-stack="v" data-gap="md-plus">
                    <div data-stack="v" data-gap="sm" className={styles['field']}>
                        <label htmlFor="sign-in-email" className={styles['label']}>
                            Email Address
                        </label>
                        <div
                            data-stack="h"
                            data-gap="sm"
                            data-align="center"
                            className={styles['input-wrapper']}
                        >
                            <Mail size={18} />
                            <input
                                type="email"
                                id="sign-in-email"
                                name="email"
                                className={styles['input']}
                                placeholder="name@organization.com"
                                autoComplete="email"
                                required
                                disabled={isBusy}
                            />
                        </div>
                    </div>
                    <div data-stack="v" data-gap="sm" className={styles['field']}>
                        <div
                            data-stack="h"
                            data-gap="md"
                            data-justify="between"
                            className={styles['label-row']}
                        >
                            <label htmlFor="sign-in-password" className={styles['label']}>
                                Password
                            </label>
                            <a href="#" className={styles['forgot-link']}>
                                Forgot password?
                            </a>
                        </div>
                        <div
                            data-stack="h"
                            data-gap="sm"
                            data-align="center"
                            className={styles['input-wrapper']}
                        >
                            <Lock size={18} />
                            <input
                                id="sign-in-password"
                                name="password"
                                className={styles['input']}
                                type="password"
                                placeholder="••••••••"
                                autoComplete="current-password"
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
                        data-justify="center"
                        data-align="center"
                        data-py="md"
                        className={styles['submit-btn']}
                        disabled={isBusy}
                    >
                        {isPreparingWorkspace ? 'Preparing workspace' : 'Sign in'}
                        <ArrowRight size={18} />
                    </button>
                </div>
            </form>
        </div>
    );
};
