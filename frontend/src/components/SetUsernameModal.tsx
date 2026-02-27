"use client";

import React, { useState } from 'react';
import './SetUsernameModal.css';

interface SetUsernameModalProps {
    token: string;
    onUsernameSet: (updatedUser: any) => void;
}

export default function SetUsernameModal({ token, onUsernameSet }: SetUsernameModalProps) {
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!username.trim() || username.trim().length < 3) {
            setError('Username must be at least 3 characters.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('http://localhost:8001/api/set-username/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ username: username.trim() }),
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
                <div className="username-modal-icon">✨</div>
                <h2>Choose your username</h2>
                <p className="username-modal-subtitle">
                    Pick a unique username for your SplitPay account.
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

                    {error && <p className="username-error">{error}</p>}

                    <p className="username-hint">
                        3-30 characters. Letters, numbers, underscores, and hyphens only.
                    </p>

                    <button
                        type="submit"
                        disabled={loading || !username.trim()}
                        className="username-submit-btn"
                    >
                        {loading ? 'Setting up...' : 'Continue'}
                    </button>
                </form>
            </div>
        </div>
    );
}
