"use client";

import React, { useState } from 'react';
import './CreateGroupModal.css';

interface CreateGroupModalProps {
    token: string;
    onClose: () => void;
    onGroupCreated: () => void;
}

export default function CreateGroupModal({ token, onClose, onGroupCreated }: CreateGroupModalProps) {
    const [groupName, setGroupName] = useState('');
    const [usernameInput, setUsernameInput] = useState('');
    const [invitedUsernames, setInvitedUsernames] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAddUsername = () => {
        const trimmed = usernameInput.trim();
        if (!trimmed) return;
        if (invitedUsernames.includes(trimmed)) {
            setError('User already added.');
            return;
        }
        setInvitedUsernames([...invitedUsernames, trimmed]);
        setUsernameInput('');
        setError('');
    };

    const handleRemoveUsername = (uname: string) => {
        setInvitedUsernames(invitedUsernames.filter(u => u !== uname));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!groupName.trim()) {
            setError('Group name is required.');
            return;
        }

        if (invitedUsernames.length === 0) {
            setError('Add at least one member.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('http://localhost:8000/api/create-group/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: groupName.trim(),
                    invited_usernames: invitedUsernames,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Something went wrong.');
                setLoading(false);
                return;
            }

            onGroupCreated();
            onClose();
        } catch {
            setError('Network error. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="cgm-overlay" onClick={onClose}>
            <div className="cgm-modal" onClick={(e) => e.stopPropagation()}>
                <button className="cgm-close" onClick={onClose}>&times;</button>

                <div className="cgm-icon">👥</div>
                <h2>Create a Group</h2>
                <p className="cgm-subtitle">Name your group and invite members by username.</p>

                <form onSubmit={handleSubmit}>
                    <div className="cgm-field">
                        <label>Group Name</label>
                        <input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="e.g. Weekend Trip"
                            autoFocus
                            className="cgm-input"
                        />
                    </div>

                    <div className="cgm-field">
                        <label>Add Members</label>
                        <div className="cgm-add-row">
                            <div className="cgm-input-wrap">
                                <span className="cgm-at">@</span>
                                <input
                                    type="text"
                                    value={usernameInput}
                                    onChange={(e) => { setUsernameInput(e.target.value); setError(''); }}
                                    placeholder="username"
                                    className="cgm-input cgm-input-member"
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddUsername(); } }}
                                />
                            </div>
                            <button type="button" onClick={handleAddUsername} className="cgm-add-btn">Add</button>
                        </div>
                    </div>

                    {invitedUsernames.length > 0 && (
                        <div className="cgm-chips">
                            {invitedUsernames.map(u => (
                                <span key={u} className="cgm-chip">
                                    @{u}
                                    <button type="button" onClick={() => handleRemoveUsername(u)} className="cgm-chip-x">&times;</button>
                                </span>
                            ))}
                        </div>
                    )}

                    {error && <p className="cgm-error">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading || !groupName.trim()}
                        className="cgm-submit-btn"
                    >
                        {loading ? 'Creating...' : 'Create Group'}
                    </button>
                </form>
            </div>
        </div>
    );
}
