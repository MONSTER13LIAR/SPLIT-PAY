"use client";

import React, { useState } from 'react';
import './SetUsernameModal.css';
import { apiFetch } from '@/utils/api';

interface SetUsernameModalProps {
    onUsernameSet: (updatedUser: any) => void;
}

export default function SetUsernameModal({ onUsernameSet }: SetUsernameModalProps) {
    const [username, setUsername] = useState('');
    const [isNonVeg, setIsNonVeg] = useState(false);
    const [isDrinker, setIsDrinker] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLinking, setIsLinking] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!username.trim() || username.trim().length < 3) {
            setError('Username must be at least 3 characters.');
            return;
        }

        setLoading(true);
        try {
            const res = await apiFetch('set-username/', {
                method: 'POST',
                body: JSON.stringify({ 
                    username: username.trim(),
                    is_non_veg: isNonVeg,
                    is_drinker: isDrinker
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Something went wrong.');
                setLoading(false);
                return;
            }

            onUsernameSet(data);
        } catch {
            setError('Network error. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="username-modal-overlay">
            <div className="username-modal">
                <div className="username-modal-icon">{isLinking ? '🔗' : '✨'}</div>
                <h2>{isLinking ? 'Link your account' : 'Choose your username'}</h2>
                <p className="username-modal-subtitle">
                    {isLinking 
                        ? 'Enter your existing username associated with this Google account.'
                        : 'Pick a unique username for your SplitPay account.'}
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="username-input-wrapper">
                        <span className="username-prefix">@</span>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => {
                                setUsername(e.target.value);
                                setError('');
                            }}
                            placeholder="your_username"
                            maxLength={30}
                            autoFocus
                            className="username-input"
                        />
                    </div>

                    <div className="preferences-wrapper">
                        <label className="pref-checkbox">
                            <input
                                type="checkbox"
                                checked={isNonVeg}
                                onChange={(e) => setIsNonVeg(e.target.checked)}
                            />
                            <span>Non-Vegetarian</span>
                        </label>

                        <label className="pref-checkbox">
                            <input
                                type="checkbox"
                                checked={isDrinker}
                                onChange={(e) => setIsDrinker(e.target.checked)}
                            />
                            <span>Drinker</span>
                        </label>
                    </div>

                    {error && <p className="username-error">{error}</p>}

                    <p className="username-hint">
                        {isLinking 
                            ? "Entering your previous username will attempt to link your data."
                            : "3-30 characters. Letters, numbers, underscores, and hyphens only."}
                    </p>

                    <button
                        type="submit"
                        disabled={loading || !username.trim()}
                        className="username-submit-btn"
                    >
                        {loading ? 'Processing...' : isLinking ? 'Link Account' : 'Continue'}
                    </button>

                    <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
                        <button
                            type="button"
                            onClick={() => {
                                setIsLinking(!isLinking);
                                setError('');
                            }}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'rgba(255, 255, 255, 0.4)',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                fontFamily: 'Inter, sans-serif'
                            }}
                        >
                            {isLinking ? "No, I'm new here" : "Already have an account?"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
