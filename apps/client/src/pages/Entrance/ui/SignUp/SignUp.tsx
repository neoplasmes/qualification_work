import { ArrowRight, Lock, Mail, User } from 'lucide-react';

import styles from './SignUp.module.scss';

export const SignUp = () => {
    return (
        <div data-stack="v" className={styles['form-container']}>
            <h2 className={styles['form-title']}>Join Us</h2>
            <p className={styles['form-subtitle']}>
                Create an account to start managing your data.
            </p>
            <form className={styles['form']} onSubmit={e => e.preventDefault()}>
                <div data-stack="v" data-gap="md">
                    <div data-stack="v" data-gap="sm" className={styles['field']}>
                        <label className={styles['label']}>Full Name</label>
                        <div
                            data-stack="h"
                            className={styles['input-wrapper']}
                            data-align="center"
                        >
                            <User size={18} />
                            <input
                                className={styles['input']}
                                type="text"
                                placeholder="John Doe"
                            />
                        </div>
                    </div>
                    <div data-stack="v" data-gap="sm" className={styles['field']}>
                        <label htmlFor="email" className={styles['label']}>
                            Email Address
                        </label>
                        <div
                            data-stack="h"
                            className={styles['input-wrapper']}
                            data-align="center"
                        >
                            <Mail size={18} />
                            <input
                                id="email"
                                type="email"
                                className={styles['input']}
                                placeholder="name@organization.com"
                            />
                        </div>
                    </div>
                    <div data-stack="v" data-gap="sm" className={styles['field']}>
                        <label className={styles['label']}>Password</label>
                        <div
                            data-stack="h"
                            className={styles['input-wrapper']}
                            data-align="center"
                        >
                            <Lock size={18} />
                            <input
                                type="password"
                                className={styles['input']}
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        data-stack="h"
                        data-gap="sm"
                        data-py="md"
                        data-justify="center"
                        data-align="center"
                        className={styles['submit-btn']}
                    >
                        Sign up
                        <ArrowRight size={18} />
                    </button>
                </div>
            </form>
        </div>
    );
};
