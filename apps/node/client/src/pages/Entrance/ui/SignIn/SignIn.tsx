import { ArrowRight, Lock, Mail } from 'lucide-react';

import signUpStyles from '../SignUp/SignUp.module.scss';
import signInStyles from './SignIn.module.scss';

const styles = { ...signUpStyles, ...signInStyles };

export const SignIn = () => {
    return (
        <div data-stack="v" className={styles['form-container']}>
            <h2 className={styles['form-title']}>Welcome Back</h2>
            <p className={styles['form-subtitle']}>
                Enter your credentials to access the analytics.
            </p>

            <form className={styles['form']} onSubmit={e => e.preventDefault()}>
                <div data-stack="v" data-gap="md-plus">
                    <div data-stack="v" data-gap="sm" className={styles['field']}>
                        <label htmlFor="email" className={styles['label']}>
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
                                id="email"
                                className={styles['input']}
                                placeholder="name@organization.com"
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
                            <label htmlFor="password" className={styles['label']}>
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
                                id="password"
                                className={styles['input']}
                                type="password"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        data-stack="h"
                        data-gap="sm"
                        data-justify="center"
                        data-align="center"
                        data-py="md"
                        className={styles['submit-btn']}
                    >
                        Sign in
                        <ArrowRight size={18} />
                    </button>
                </div>
            </form>
        </div>
    );
};
